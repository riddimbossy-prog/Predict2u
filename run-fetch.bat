@echo off
REM ============================================================
REM  Golden Banker - double-click this to fetch today's matches
REM ============================================================
cd /d "%~dp0"
echo.
echo Fetching today's matches...
echo.
node fetch-data.js
echo.
echo ------------------------------------------------------------
echo If you saw match names above, data.js is updated.
echo Now drag this whole folder to app.netlify.com/drop
echo to update your live website.
echo ------------------------------------------------------------
echo.
pause
