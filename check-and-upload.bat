@echo off
echo Checking files before uploading...

REM Check for index.html
if not exist "dist\vesta-frontend\browser\index.html" (
    echo Error: index.html not found!
    exit /b 1
)

REM Check for main JavaScript file
if not exist "dist\vesta-frontend\browser\*.js" (
    echo Error: No JavaScript files found!
    exit /b 1
)

REM Check for .htaccess
if not exist "dist\vesta-frontend\browser\.htaccess" (
    echo Warning: .htaccess file not found! Angular routing may not work properly.
    echo Creating a basic .htaccess file...
    
    echo # Redirect all requests to index.html for Angular routing > "dist\vesta-frontend\browser\.htaccess"
    echo ^<IfModule mod_rewrite.c^> >> "dist\vesta-frontend\browser\.htaccess"
    echo   RewriteEngine On >> "dist\vesta-frontend\browser\.htaccess"
    echo   RewriteBase / >> "dist\vesta-frontend\browser\.htaccess"
    echo   RewriteRule ^index\.html$ - [L] >> "dist\vesta-frontend\browser\.htaccess"
    echo   RewriteCond %%{REQUEST_FILENAME} !-f >> "dist\vesta-frontend\browser\.htaccess"
    echo   RewriteCond %%{REQUEST_FILENAME} !-d >> "dist\vesta-frontend\browser\.htaccess"
    echo   RewriteRule . /index.html [L] >> "dist\vesta-frontend\browser\.htaccess"
    echo ^</IfModule^> >> "dist\vesta-frontend\browser\.htaccess"
)

echo All required files are present and ready for upload.

REM Run the upload script
echo.
echo Choose your upload method:
echo 1. SCP Upload (Direct)
echo 2. SFTP Upload (WinSCP)
echo.
set /p choice="Enter your choice (1-2): "

if "%choice%"=="1" (
    call scp-upload.bat
) else if "%choice%"=="2" (
    call sftp-upload.bat
) else (
    echo Invalid choice. Please run either scp-upload.bat or sftp-upload.bat manually.
)

exit /b 0
