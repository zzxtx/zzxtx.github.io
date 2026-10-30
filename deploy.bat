@echo off
chcp 65001 >nul 2>nul
cd /d "%~dp0"
echo.
echo  ============================================
echo    Hexo 部署 - 自动识别代理，开不开 VPN 都行
echo  ============================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy.ps1"
if errorlevel 1 echo.
if errorlevel 1 echo  [失败] 部署没有成功，原因见上方最后几行。
if errorlevel 1 echo  [提示] 如果显示 no proxy available，打开 VPN 后重新运行本脚本。
if errorlevel 1 echo  [提示] 如果 VPN 已开仍然失败，确认其 HTTP 端口是 7897 / 7890 / 10809。
if not errorlevel 1 echo  [完成] 部署成功，约 1 分钟后生效：https://zzxtx.github.io
echo.
pause
exit /b %RC%
