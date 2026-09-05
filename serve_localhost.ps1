$port = 5173
$prefix = "http://localhost:$port/"
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)

try {
    $listener.Start()
    Write-Host "MedLens Local Server running at $prefix"
    $htmlPath = Join-Path $PSScriptRoot "index.html"
    
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $response = $context.Response
        
        if (Test-Path $htmlPath) {
            $content = [System.IO.File]::ReadAllBytes($htmlPath)
            $response.ContentType = "text/html; charset=utf-8"
            $response.ContentLength64 = $content.Length
            $response.OutputStream.Write($content, 0, $content.Length)
        } else {
            $response.StatusCode = 404
        }
        $response.Close()
    }
} catch {
    Write-Error $_.Exception.Message
} finally {
    $listener.Stop()
}
