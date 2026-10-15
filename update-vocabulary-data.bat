@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 (
  echo Node.js was not found.
  pause
  exit /b 1
)
node scripts\build-static-data.js
if errorlevel 1 goto fail
echo.
echo Updated vocabulary data from data\vocabulary.csv.
pause
exit /b 0
:fail
echo.
echo Update failed. Check data\vocabulary.csv.
pause
exit /b 1
