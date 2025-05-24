@echo off
echo Preparing to deploy backend changes to Render...

cd %~dp0
cd vestaBackend

echo Committing changes to Git...
git add server.js middleware/securityHeaders.js
git commit -m "Fix CORS configuration for frontend access"

echo Pushing changes to GitHub...
git push origin master

echo Changes pushed! Render will automatically redeploy your backend.
echo Please check your Render dashboard for deployment status.
