@echo off
rem filepath: c:\Users\shuga\OneDrive\Desktop\Vesta\vesta-repo\Vesta\ensure-admin.bat

echo Ensuring admin account exists...

rem Change to backend directory
cd vestaBackend

rem Run the ensure-admin script
node scripts/ensure-admin.js

echo Admin verification completed.
pause
