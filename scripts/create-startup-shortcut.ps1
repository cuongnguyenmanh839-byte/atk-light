$ws = New-Object -ComObject WScript.Shell
$startupFolder = [Environment]::GetFolderPath('Startup')
$shortcutPath = Join-Path $startupFolder "ATK-LIGHT-24-7.lnk"
$targetPath = Join-Path $PSScriptRoot "..\CHAY-NGAM-24-7.vbs"
$workingDir = Resolve-Path (Join-Path $PSScriptRoot "..")

$s = $ws.CreateShortcut($shortcutPath)
$s.TargetPath = $targetPath
$s.WorkingDirectory = $workingDir.Path
$s.Description = "Khoi dong ATK Light tu dong 24/24"
$s.Save()

Write-Host "Da tao shortcut tai: $shortcutPath"
