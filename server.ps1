# Built-in PowerShell HTTP Static Server (Zero dependencies)
param (
  [int]$Port = 8080
)

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Prefixes.Add("http://127.0.0.1:$Port/")
try {
  $listener.Start()
} catch {
  Write-Error "Could not start HttpListener: $_"
  exit 1
}

Write-Output "Serving files from $pwd on http://localhost:$Port/"

$mimeTypes = @{
  ".html" = "text/html; charset=utf-8"
  ".css"  = "text/css; charset=utf-8"
  ".js"   = "application/javascript; charset=utf-8"
  ".svg"  = "image/svg+xml"
  ".png"  = "image/png"
  ".jpg"  = "image/jpeg"
  ".jpeg" = "image/jpeg"
  ".webp" = "image/webp"
  ".xml"  = "application/xml; charset=utf-8"
  ".txt"  = "text/plain; charset=utf-8"
  ".json" = "application/json; charset=utf-8"
}

try {
  while ($listener.IsListening) {
    try {
      $context = $listener.GetContext()
      $request = $context.Request
      $response = $context.Response

      $relPath = $request.Url.LocalPath.TrimStart('/')
      if ([string]::IsNullOrWhiteSpace($relPath)) {
        $relPath = "index.html"
      }

      $fullPath = Join-Path $pwd $relPath
      if (Test-Path -Path $fullPath -PathType Container) {
        $fullPath = Join-Path $fullPath "index.html"
      }

      if (Test-Path -Path $fullPath -PathType Leaf) {
        $ext = [System.IO.Path]::GetExtension($fullPath).ToLowerInvariant()
        $contentType = $mimeTypes[$ext]
        if (-not $contentType) { $contentType = "application/octet-stream" }

        $bytes = [System.IO.File]::ReadAllBytes($fullPath)
        $response.ContentType = $contentType
        $response.ContentLength64 = $bytes.Length
        $response.Headers.Add("Access-Control-Allow-Origin", "*")
        $response.Headers.Add("Cache-Control", "no-cache")

        if ($request.HttpMethod -ne "HEAD") {
          $response.OutputStream.Write($bytes, 0, $bytes.Length)
        }
      } else {
        $response.StatusCode = 404
        $msg = [System.Text.Encoding]::UTF8.GetBytes("<h1>404 Not Found</h1>")
        $response.ContentType = "text/html; charset=utf-8"
        $response.ContentLength64 = $msg.Length
        if ($request.HttpMethod -ne "HEAD") {
          $response.OutputStream.Write($msg, 0, $msg.Length)
        }
      }
      $response.OutputStream.Close()
    } catch {
      # Handle client disconnect gracefully without stopping server
    }
  }
} finally {
  $listener.Stop()
  $listener.Close()
}
