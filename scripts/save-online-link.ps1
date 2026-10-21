param(
    [string]$Url = "https://machines-stripes-relevant-travels.trycloudflare.com"
)

$desktop = [Environment]::GetFolderPath("Desktop")
$desktopShortcut = Join-Path $desktop "LINK-TRUY-CAP-ONLINE.url"
$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$projectTxt = Join-Path $projectRoot "LINK-TRUY-CAP-ONLINE.txt"

$content = @"
[InternetShortcut]
URL=$Url
IconIndex=0
"@

Set-Content -Path $desktopShortcut -Value $content -Encoding utf8

$infoContent = @"
============================================================
           LINK TRUY CAP WEB ATK LIGHT ONLINE 24/7
============================================================

LINK TRUY CAP TRUC TIEP:
$Url

- Mo link tren tren may tinh hoac dien thoai bat ky (4G, 5G, Wifi khac deu vao duoc).
- Web chay 24/7 thong qua Cloudflare Tunnel ma hoa HTTPS bao mat.
- Da tao loi tat 'LINK-TRUY-CAP-ONLINE' ngay tren Man Hinh Desktop!

Thoi diem cap nhat: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
============================================================
"@

Set-Content -Path $projectTxt -Value $infoContent -Encoding utf8
Write-Host "Da luu link online thanh cong: $Url"
