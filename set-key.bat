@echo off
REM ============================================================
REM  Golden Banker - one-time key setup
REM  Double-click this, paste your token when asked, done.
REM ============================================================
cd /d "%~dp0"
echo.
echo ============================================================
echo  GOLDEN BANKER - SET YOUR API KEY
echo ============================================================
echo.
echo Paste your API-Football token below and press Enter.
echo (Right-click in this window to paste, then hit Enter.)
echo.
set /p TOKEN="Token: "
echo.
node write-config.js "%TOKEN%"
echo.
echo ------------------------------------------------------------
echo Done. Now double-click run-fetch.bat to pull matches.
echo ------------------------------------------------------------
echo.
pause
