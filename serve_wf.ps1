$ErrorActionPreference = 'Stop'
$p = Join-Path $env:LOCALAPPDATA 'Comfy-Desktop\ComfyUI-Installs\ComfyUI\ComfyUI\user\default\workflows\edo1_sleep1.json'
$bytes = [IO.File]::ReadAllBytes($p)
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add('http://127.0.0.1:17654/')
$listener.Start()
Write-Output "LISTENING http://127.0.0.1:17654/ bytes=$($bytes.Length)"
$deadline = (Get-Date).AddMinutes(12)
$served = 0
while ($listener.IsListening -and $served -lt 3 -and (Get-Date) -lt $deadline) {
  $ar = $listener.BeginGetContext($null, $null)
  $ok = $ar.AsyncWaitHandle.WaitOne(5000)
  if (-not $ok) { continue }
  $ctx = $listener.EndGetContext($ar)
  $res = $ctx.Response
  $res.StatusCode = 200
  $res.ContentType = 'application/json'
  $res.Headers.Add('Access-Control-Allow-Origin', '*')
  $res.Headers.Add('Access-Control-Allow-Headers', '*')
  if ($ctx.Request.HttpMethod -eq 'OPTIONS') { $res.Close() ; continue }
  $out = $res.OutputStream
  $out.Write($bytes, 0, $bytes.Length)
  $out.Close()
  $served++
  Write-Output ("served " + $ctx.Request.RawUrl + " to " + $ctx.Request.RemoteEndPoint)
}
$listener.Stop()
Write-Output "STOPPED served=$served"
