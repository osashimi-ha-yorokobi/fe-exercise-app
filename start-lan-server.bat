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

node -e "const http=require('node:http'),fs=require('node:fs'),os=require('node:os');const file=process.argv[1],port=Number(process.env.FE_LAN_PORT||4173);const server=http.createServer((req,res)=>{if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405,{'Allow':'GET, HEAD'});res.end();return}if(req.url!=='/'&&req.url!=='/index.html'){res.writeHead(404);res.end();return}fs.readFile(file,(err,body)=>{if(err){res.writeHead(500);res.end();return}res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Content-Length':body.length,'Cache-Control':'no-store'});res.end(req.method==='HEAD'?undefined:body)})});server.on('error',err=>{console.error(err.message);process.exitCode=1});server.listen(port,'0.0.0.0',()=>{console.log('LAN server running on port '+port);for(const items of Object.values(os.networkInterfaces()))for(const item of items||[])if(item.family==='IPv4'&&!item.internal)console.log('http://'+item.address+':'+port+'/')})" "%~dp0index.html"

if errorlevel 1 (
  echo.
  echo The server stopped because an error occurred.
  pause
  exit /b 1
)
