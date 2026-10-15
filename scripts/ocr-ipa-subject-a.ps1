param([string]$InputDirectory = (Join-Path $PSScriptRoot '../tmp/ipa-subject-a'))

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null = [Windows.Storage.StorageFile,Windows.Storage,ContentType=WindowsRuntime]
$null = [Windows.Graphics.Imaging.BitmapDecoder,Windows.Graphics.Imaging,ContentType=WindowsRuntime]
$null = [Windows.Media.Ocr.OcrEngine,Windows.Foundation,ContentType=WindowsRuntime]
$null = [Windows.Globalization.Language,Windows.Foundation,ContentType=WindowsRuntime]

function Await-WinRT($operation, $resultType) {
  $method = [System.WindowsRuntimeSystemExtensions].GetMethods() |
    Where-Object { $_.Name -eq 'AsTask' -and $_.IsGenericMethod -and $_.GetParameters().Count -eq 1 } |
    Select-Object -First 1
  $task = $method.MakeGenericMethod($resultType).Invoke($null, @($operation))
  try { $task.Wait() } catch { throw $task.Exception.ToString() }
  return $task.Result
}

$InputDirectory = (Resolve-Path $InputDirectory).ProviderPath
$engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage([Windows.Globalization.Language]::new('ja'))
if (!$engine) { throw 'Windows Japanese OCR is unavailable' }
$poppler = (Get-Command pdftoppm.exe -ErrorAction Stop).Source
$pdfinfo = (Get-Command pdfinfo.exe -ErrorAction Stop).Source
$pageImage = Join-Path $InputDirectory '_ocr_page.png'
$pageBase = Join-Path $InputDirectory '_ocr_page'
foreach ($pdf in (Get-ChildItem $InputDirectory -Filter '*_fe_am_qs.pdf' | Sort-Object Name)) {
  $output = [IO.Path]::ChangeExtension($pdf.FullName, '.txt')
  if (Test-Path $output) { Write-Output "skip $($pdf.Name)"; continue }
  $info = & $pdfinfo $pdf.FullName
  $pages = [int](([regex]::Match(($info -join "`n"), '(?m)^Pages:\s+(\d+)')).Groups[1].Value)
  if ($pages -lt 1) { throw "Unable to get page count: $($pdf.Name)" }
  $builder = [System.Text.StringBuilder]::new()
  for ($page = 1; $page -le $pages; $page++) {
    & $poppler -f $page -l $page -scale-to 1800 -png -singlefile $pdf.FullName $pageBase
    if ($LASTEXITCODE -ne 0) { throw "PDF rendering failed: $($pdf.Name), page $page" }
    $file = Await-WinRT ([Windows.Storage.StorageFile]::GetFileFromPathAsync($pageImage)) ([Windows.Storage.StorageFile])
    $stream = Await-WinRT ($file.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream])
    $decoder = Await-WinRT ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
    $bitmap = Await-WinRT ($decoder.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])
    $result = Await-WinRT ($engine.RecognizeAsync($bitmap)) ([Windows.Media.Ocr.OcrResult])
    [void]$builder.AppendLine("`n---PAGE $page---`n" + $result.Text)
    $bitmap.Dispose()
    $stream.Dispose()
    Remove-Item -LiteralPath $pageImage
  }
  [IO.File]::WriteAllText($output, $builder.ToString(), [Text.Encoding]::UTF8)
  Write-Output "ocr $($pdf.Name): $pages pages, $($builder.Length) characters"
}
