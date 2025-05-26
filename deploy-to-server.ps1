# Deploy Vesta Frontend to Server
# PowerShell script to upload built files to server

$ServerUser = "u934185407"
$ServerIP = "178.16.128.221"
$ServerPort = "65002"
$LocalPath = "c:\Users\shuga\OneDrive\Desktop\Vesta\vesta-repo\Vesta\dist\vesta-frontend\browser\*"
$RemotePath = "/home/$ServerUser/public_html/"

Write-Host "Starting deployment to server..." -ForegroundColor Green

# Check if the dist folder exists
if (!(Test-Path "c:\Users\shuga\OneDrive\Desktop\Vesta\vesta-repo\Vesta\dist\vesta-frontend\browser")) {
    Write-Host "Error: Build files not found. Please run 'npm run build' first." -ForegroundColor Red
    exit 1
}

Write-Host "Build files found. Preparing to upload..." -ForegroundColor Yellow

# Create a compressed archive for faster upload
$ZipPath = "c:\Users\shuga\OneDrive\Desktop\Vesta\vesta-repo\Vesta\vesta-frontend-build.zip"
if (Test-Path $ZipPath) {
    Remove-Item $ZipPath -Force
}

Write-Host "Creating compressed archive..." -ForegroundColor Yellow
Compress-Archive -Path "c:\Users\shuga\OneDrive\Desktop\Vesta\vesta-repo\Vesta\dist\vesta-frontend\browser\*" -DestinationPath $ZipPath

Write-Host "Archive created: $ZipPath" -ForegroundColor Green
Write-Host "File size: $((Get-Item $ZipPath).Length / 1MB) MB" -ForegroundColor Cyan

Write-Host "`nTo upload to your server, run these commands:" -ForegroundColor Yellow
Write-Host "1. Upload the zip file:" -ForegroundColor Cyan
Write-Host "   scp -P $ServerPort `"$ZipPath`" $ServerUser@${ServerIP}:~/" -ForegroundColor White

Write-Host "`n2. Connect to your server:" -ForegroundColor Cyan
Write-Host "   ssh -p $ServerPort $ServerUser@$ServerIP" -ForegroundColor White

Write-Host "`n3. On the server, extract and deploy:" -ForegroundColor Cyan
Write-Host "   unzip ~/vesta-frontend-build.zip -d ~/public_html/" -ForegroundColor White
Write-Host "   rm ~/vesta-frontend-build.zip" -ForegroundColor White

Write-Host "`nAlternatively, use SCP to upload files directly:" -ForegroundColor Yellow
Write-Host "   scp -P $ServerPort -r `"c:\Users\shuga\OneDrive\Desktop\Vesta\vesta-repo\Vesta\dist\vesta-frontend\browser\*`" $ServerUser@${ServerIP}:$RemotePath" -ForegroundColor White

Write-Host "`nDeployment package ready!" -ForegroundColor Green
