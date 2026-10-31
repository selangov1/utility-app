[CmdletBinding()]
param(
    [int]$BackendPort = 47831,
    [int]$FrontendPort = 47832
)

$ErrorActionPreference = 'Stop'

foreach ($port in $BackendPort, $FrontendPort) {
    if (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) {
        throw "Port $port is already in use."
    }
}

$env:BACKEND_PORT = $BackendPort
$env:FRONTEND_PORT = $FrontendPort

$backend = Start-Process -PassThru -NoNewWindow -WorkingDirectory "$PSScriptRoot\backend" `
    -FilePath uv -ArgumentList 'run', 'uvicorn', 'app.main:app', '--reload', '--no-server-header', '--port', $BackendPort

try {
    Write-Host "Backend:  http://localhost:$BackendPort"
    Write-Host "Frontend: http://localhost:$FrontendPort"
    Push-Location "$PSScriptRoot\frontend"
    npm run dev
}
finally {
    Pop-Location
    if ($backend -and -not $backend.HasExited) {
        taskkill /PID $backend.Id /T /F | Out-Null
    }
}
