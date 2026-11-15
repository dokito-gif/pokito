$ErrorActionPreference = 'Stop'
$src = Join-Path $env:LOCALAPPDATA 'Comfy-Desktop\ComfyUI-Installs\ComfyUI\ComfyUI\user\default\workflows\edo1_sleep1.json'
$tmp = Join-Path $env:TEMP 'edo1_sleep1_upload.json'
Copy-Item $src $tmp -Force
$client = [System.Net.Http.HttpClient]::new()
$client.Timeout = [TimeSpan]::FromSeconds(60)
function Post-Upload($url, $field, $name, $ctype) {
  $mp = [System.Net.Http.MultipartFormDataContent]::new()
  $bytes = [IO.File]::ReadAllBytes($tmp)
  $sc = [System.Net.Http.ByteArrayContent]::new($bytes)
  $sc.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse($ctype)
  $mp.Add($sc, $field, $name)
  try {
    $resp = $client.PostAsync($url, $mp).GetAwaiter().GetResult()
    $txt = $resp.Content.ReadAsStringAsync().GetAwaiter().GetResult()
    Write-Output ("### POST " + $url + " field=" + $field + " -> HTTP " + [int]$resp.StatusCode)
    Write-Output $txt.Substring(0, [Math]::Min(400, $txt.Length))
  } catch {
    Write-Output ("### POST " + $url + " field=" + $field + " ERR " + $_.Exception.Message)
  }
}
Post-Upload 'http://127.0.0.1:8188/upload/image' 'image' 'edo1_sleep1.json' 'application/json'
Post-Upload 'http://127.0.0.1:8188/upload/image' 'image' 'edo1_sleep1.json' 'image/png'
Post-Upload 'http://127.0.0.1:8188/upload/file' 'file' 'edo1_sleep1.json' 'application/json'
Post-Upload 'http://127.0.0.1:8188/upload/file' 'file' 'edo1_sleep1.json' 'image/png'
