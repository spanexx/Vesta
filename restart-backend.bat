@echo off
echo Restarting the Vesta backend server with updated CORS settings...

cd %~dp0
cd vestaBackend

echo Testing environment variables...
node test-cors.js

echo Stopping any running server instances...
taskkill /F /IM node.exe 2>nul

echo Starting server...
set NODE_ENV=production
set CORS_ORIGINS=https://vesta.spanexx.com,http://localhost:4200
set FRONTEND_URL=https://vesta.spanexx.com
node server.js
