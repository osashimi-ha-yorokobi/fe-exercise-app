@echo off
setlocal

cd /d "%~dp0"
title FE Exercise LAN Server

where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js was not found.
  echo Install Node.js or add it to PATH, then try again.
  pause
  exit /b 1
)

echo Starting the FE Exercise LAN server...
echo Keep this window open while using the application.
echo Press Ctrl+C or close this window to stop the server.
echo.

node "%~dp0server.js"

if errorlevel 1 (
  echo.
  echo The server stopped because an error occurred.
  pause
  exit /b 1
)
