@echo off
echo Deploying frontend to hosting service...

REM Create a ZIP file of the dist folder
powershell -command "Compress-Archive -Path 'dist\vesta-frontend\*' -DestinationPath 'dist\vesta-frontend.zip' -Force"

echo.
echo Build successfully compressed.
echo.
echo Please upload the file "dist\vesta-frontend.zip" to your hosting service.
echo For most hosting services, you can extract this ZIP file into the web root directory.
echo.
echo Remember to configure your hosting service with these settings:
echo 1. Set all requests to be redirected to index.html (for Angular routing)
echo 2. Configure CORS headers to allow requests from your frontend domain
echo 3. Ensure proper caching headers for static assets
echo.
echo Deployment package ready!
