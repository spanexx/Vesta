# Render Deployment Checklist

This checklist will help ensure your Vesta application is properly deployed on Render.

## Backend Deployment

1. **Verify Environment Variables**
   - Make sure your Render service has all necessary environment variables:
     - `NODE_ENV=production`
     - `PORT=10000` (or whatever port Render assigns)
     - `MONGODB_URI=mongodb+srv://...`
     - `JWT_SECRET=your_secret`
     - `FRONTEND_URL=https://vesta.spanexx.com`
     - `CORS_ORIGINS=https://vesta.spanexx.com,http://localhost:4200`
     - `MAIN_ADMIN_USERNAME=mainadmin`
     - `MAIN_ADMIN_EMAIL=admin@vesta.com`
     - `MAIN_ADMIN_PASSWORD=securePass123`
     - All other required variables from your .env file

2. **Reset Admin Account**
   - Use the Render web terminal to run the admin reset script:
     - SSH into your Render service using the web shell
     - Copy the contents of `reset-admin.sh` into a file on the server
     - Make it executable: `chmod +x reset-admin.sh`
     - Run it: `./reset-admin.sh`

3. **Test Critical Endpoints**
   - Run the `test-api-endpoints.ps1` script locally to verify API endpoints
   - Verify that admin login works at: `https://vesta-btp1.onrender.com/api/admin/login`
   - Verify that media uploads work

## Frontend Deployment

1. **Build the Angular Application**
   - Run: `npm run build:prod`
   - Verify the build completes successfully

2. **Upload to Web Host**
   - Use the `scp-upload.bat` script to upload files to your host
   - Make sure all files in `dist/vesta-frontend/browser` are uploaded

3. **Verify Configuration**
   - Ensure `.htaccess` is properly uploaded with the server
   - Make sure the server redirects all requests to `index.html`

## Post-Deployment Verification

1. **Test Admin Login**
   - Go to: `https://vesta.spanexx.com/admin/login`
   - Log in with the admin credentials:
     - Email: `admin@vesta.com`
     - Password: `securePass123`

2. **Test User Functionality**
   - Create a test user account
   - Test profile creation and updates
   - Test document uploads
   - Test verification document uploads

3. **Check for 404 Errors**
   - Open browser developer tools and check the Network tab
   - Verify there are no 404 or CORS errors when accessing API endpoints

## Troubleshooting Common Issues

1. **CORS Errors**
   - Verify `CORS_ORIGINS` environment variable includes your frontend domain
   - Check that your backend server is properly handling CORS headers

2. **404 Errors for Media Uploads**
   - Check that the `/api/media` endpoints are properly registered in your server
   - Verify your frontend is using the correct URL (`https://vesta-btp1.onrender.com/api/media`)

3. **Authentication Issues**
   - Reset the admin password using the reset script
   - Check that JWT tokens are being properly generated and validated

4. **Database Connection Issues**
   - Verify your MongoDB URI is correct
   - Check that your IP is whitelisted in MongoDB Atlas
