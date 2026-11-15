$ErrorActionPreference = 'Continue'
$pid2 = 'bd7af947-40fe-4dc5-ae6a-5f8f9e8dfaa1'
$outDir = Join-Path $env:LOCALAPPDATA 'Comfy-Desktop\ComfyUI-Shared\output\ganmen_h3'
$deadline = (Get-Date).AddMinutes(55)
$lastMsg = ''
while ((Get-Date) -lt $deadline) {
  Start-Sleep -Seconds 40
  try {
    $q = Invoke-RestMethod 'http://127.0.0.1:8188/prompt' -TimeoutSec 10
    $rem = $q.exec_info.queue_remaining
  } catch { $rem = -1 }
  try {
    $h = Invoke-RestMethod ("http://127.0.0.1:8188/history/" + $pid2) -TimeoutSec 10
  } catch { $h = $null }
  $names = @()
  if ($h -and $h.PSObject.Properties.Name -contains $pid2) {
    $entry = $h.$pid2
    $status = $entry.status.state
    $outputs = $entry.outputs
    if ($outputs -and $outputs.images) { $names = @($outputs.images | ForEach-Object { $_.filename }) }
    Write-Output ("[$(Get-Date -Format HH:mm:ss)] DONE state=$status files=" + ($names -join ', '))
    if ($entry.status.last_error) { Write-Output ("last_error=" + ($entry.status.last_error | ConvertTo-Json -Depth 8 -Compress)) }
    if ($status -eq 'success' -or $names.Count -gt 0) { exit 0 }
    if ($status -eq 'failed' -or ($entry.status.last_error)) { exit 2 }
  } else {
    Write-Output ("[$(Get-Date -Format HH:mm:ss)] running queue_remaining=$rem")
  }
}
Write-Output 'TIMEOUT waiting for completion'
exit 3
