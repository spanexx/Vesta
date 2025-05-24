@echo off
echo Creating WinSCP script for uploading files...

REM Create the WinSCP script file
echo open sftp://u934185407:password@178.16.128.221:65002 -hostkey=* > upload.winscp
echo option batch on >> upload.winscp
echo option confirm off >> upload.winscp
echo lcd "dist\vesta-frontend\browser" >> upload.winscp
echo cd /public_html >> upload.winscp
echo synchronize remote >> upload.winscp
echo exit >> upload.winscp

echo.
echo To upload files using WinSCP:
echo 1. Download and install WinSCP from https://winscp.net/ if you don't have it already
echo 2. Replace "password" in the upload.winscp file with your actual password
echo 3. Run the following command:
echo    "C:\Program Files (x86)\WinSCP\WinSCP.exe" /script=upload.winscp
echo.
echo Alternatively, you can manually upload the files in dist\vesta-frontend\browser to your server's public_html directory.
