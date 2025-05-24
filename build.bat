@echo off
echo Building Angular application...
call npm install --legacy-peer-deps
call ng build --configuration=production

echo Preparing files for deployment...

IF EXIST "src\assets\_redirects" (
    copy "src\assets\_redirects" "dist\vesta-frontend\" /Y
) ELSE (
    echo _redirects file not found, skipping...
)

IF EXIST "render.yaml" (
    copy "render.yaml" "dist\vesta-frontend\" /Y
) ELSE (
    echo render.yaml file not found, skipping...
)

IF EXIST "web.config" (
    copy "web.config" "dist\vesta-frontend\" /Y
) ELSE (
    echo web.config file not found, skipping...
)

IF EXIST ".htaccess" (
    copy ".htaccess" "dist\vesta-frontend\" /Y
) ELSE (
    echo .htaccess file not found, skipping...
)

echo Build completed successfully!
