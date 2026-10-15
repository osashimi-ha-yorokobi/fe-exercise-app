param([string]$OutputDirectory = (Join-Path $PSScriptRoot '../tmp/ipa-subject-a'))

$ErrorActionPreference = 'Stop'
New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null
$pages = @()
for ($year = 2012; $year -le 2019; $year++) {
  $heisei = $year - 1988
  $pages += "https://www.ipa.go.jp/shiken/mondai-kaiotu/${year}h${heisei}.html"
}
for ($year = 2023; $year -le 2026; $year++) {
  $reiwa = $year - 2018
  $pages += "https://www.ipa.go.jp/shiken/mondai-kaiotu/sg_fe/koukai/${year}r{0:D2}.html" -f $reiwa
}

$urls = [System.Collections.Generic.List[string]]::new()
foreach ($page in $pages) {
  $response = Invoke-WebRequest -Uri $page -UseBasicParsing
  $matches = @($response.Links | Where-Object { $_.href -match '/\d{4}(?:h\d+[ah]?|r\d+[ah]?)_fe_(?:am|kamoku_a)_qs\.pdf$' })
  if ($matches.Count -eq 0) { throw "FE 科目A/午前のPDFが見つかりません: $page" }
  foreach ($link in $matches) { $urls.Add(([Uri]::new([Uri]$page, $link.href)).AbsoluteUri) }
}
$urls = @($urls | Select-Object -Unique)
foreach ($url in $urls) {
  $file = Join-Path $OutputDirectory ([IO.Path]::GetFileName(([Uri]$url).AbsolutePath))
  if (!(Test-Path $file)) { Invoke-WebRequest -Uri $url -OutFile $file }
  Write-Output "$file`t$url"
}
