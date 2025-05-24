@echo off
echo Uploading frontend files to server using SCP...

REM Check if dist\vesta-frontend\browser exists
if not exist "dist\vesta-frontend\browser" (
    echo Error: dist\vesta-frontend\browser directory not found.
    echo Please run 'npm run build:prod' first.
    exit /b 1
)

echo.
echo Using SCP to upload files to the server...
echo This process might take a few minutes depending on the size of your build.
echo.

REM Upload all files using SCP
scp -r -P 65002 dist\vesta-frontend\browser\* u934185407@178.16.128.221:~/public_html/

echo.
echo Upload complete!
echo.
echo Your application should now be accessible at your domain.
echo Don't forget to verify that your server is properly configured to handle Angular's routing:
echo - All 404 requests should redirect to index.html
echo - CORS is properly configured on the backend
echo.
