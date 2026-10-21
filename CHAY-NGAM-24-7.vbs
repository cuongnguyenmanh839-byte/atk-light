Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
currentDir = fso.GetParentFolderName(WScript.ScriptFullName)

' Chay toan bo dich vu ATK Light (Backend, Frontend Vite, Cloudflare Tunnel 24/7) hoan toan an khong cua so
WshShell.Run "powershell.exe -WindowStyle Hidden -ExecutionPolicy Bypass -File """ & currentDir & "\scripts\start-all-services.ps1""", 0, False
