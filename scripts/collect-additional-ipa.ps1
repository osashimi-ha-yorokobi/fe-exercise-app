$ErrorActionPreference = 'Stop'
$taskCorpus = Join-Path $PSScriptRoot '../tmp/ipa-subject-a'
$taskSources = @(
  'https://www.ipa.go.jp/shiken/about/ug65p90000001fci-att/tokurei_Mondai_20130623_FE.pdf',
  'https://www.ipa.go.jp/shiken/about/ug65p90000001bq0-att/tokurei_Mondai_20180610_FE.pdf',
  'https://www.ipa.go.jp/shiken/about/ug65p90000001bq0-att/tokurei_Mondai_20200126_FE.pdf',
  'https://www.ipa.go.jp/shiken/about/ug65p90000001bq0-att/tokurei_Mondai_20200726_FE.pdf',
  'https://www.ipa.go.jp/shiken/about/ug65p90000001bq0-att/tokurei_Mondai_20201213_FE.pdf',
  'https://www.ipa.go.jp/shiken/about/ug65p90000001bq0-att/tokurei_Mondai_20230122_FE.pdf',
  'https://www.ipa.go.jp/shiken/about/gmcbt800000077l9-att/tokurei_Mondai_20250608_FE.pdf'
)
foreach ($taskSource in $taskSources) {
  $taskTarget = Join-Path $taskCorpus ([IO.Path]::GetFileName(([Uri]$taskSource).AbsolutePath))
  if (!(Test-Path -LiteralPath $taskTarget)) { Invoke-WebRequest -Uri $taskSource -OutFile $taskTarget }
  Write-Output ([IO.Path]::GetFileName($taskTarget))
}
