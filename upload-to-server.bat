@echo off
echo Uploading frontend files to server...

REM Create a deployment package
powershell -command "Compress-Archive -Path 'dist\vesta-frontend\browser\*' -DestinationPath 'dist\vesta-frontend.zip' -Force"

REM Upload the deployment package to the server
echo Uploading deployment package to server...
scp -P 65002 dist\vesta-frontend.zip u934185407@178.16.128.221:~/

REM Connect to server and extract the files
echo Connecting to server to extract files...
ssh -p 65002 u934185407@178.16.128.221 "unzip -o ~/vesta-frontend.zip -d ~/public_html/ && rm ~/vesta-frontend.zip"

echo.
echo Deployment complete!
echo.
echo Your application should now be accessible at your domain.
