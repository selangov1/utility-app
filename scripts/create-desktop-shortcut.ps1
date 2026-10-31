[CmdletBinding()]
param(
    [string]$Name = 'Utility App',
    [string]$Destination = [Environment]::GetFolderPath('Desktop')
)

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$electron = Join-Path $root 'node_modules\electron\dist\electron.exe'
$entry = Join-Path $root 'out\main\index.js'

if (-not (Test-Path $electron)) { throw "Electron not found. Run 'npm install' first." }
if (-not (Test-Path $entry)) { throw "Built app not found. Run 'npm run build' first." }

# Windows shortcuts need an .ico; wrap build\icon.png in a single-image (PNG-compressed) ICO.
$png = Join-Path $root 'build\icon.png'
$ico = Join-Path $root 'build\icon.ico'
Add-Type -AssemblyName System.Drawing
$image = [System.Drawing.Image]::FromFile($png)
try { $width = [Math]::Min($image.Width, 256); $height = [Math]::Min($image.Height, 256) } finally { $image.Dispose() }
$pngBytes = [IO.File]::ReadAllBytes($png)
$stream = [IO.File]::Create($ico)
$writer = New-Object IO.BinaryWriter($stream)
try {
    $writer.Write([uint16]0); $writer.Write([uint16]1); $writer.Write([uint16]1)
    $writer.Write([byte]($width % 256)); $writer.Write([byte]($height % 256))
    $writer.Write([byte]0); $writer.Write([byte]0)
    $writer.Write([uint16]1); $writer.Write([uint16]32)
    $writer.Write([uint32]$pngBytes.Length); $writer.Write([uint32]22)
    $writer.Write($pngBytes)
}
finally { $writer.Dispose(); $stream.Dispose() }

$link = Join-Path $Destination "$Name.lnk"
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($link)
$shortcut.TargetPath = $electron
$shortcut.Arguments = "`"$root`""
$shortcut.WorkingDirectory = $root
$shortcut.IconLocation = "$ico,0"
$shortcut.Description = 'Searchable developer utilities that run entirely on your device.'
$shortcut.Save()

Write-Host "Created $link"
