# Admin Account Setup Checklist

## Automatic Admin Creation
The system is designed to automatically create an admin account during server startup. This happens in the following sequence:
1. In `server.js`, after connecting to MongoDB, the `createMainAdmin()` function from `adminSeeder.js` is called
2. The seeder checks if an admin account exists with the configured email address
3. If no admin account exists, it creates one using the environment variables or default values

## Environment Variables
For proper admin account creation, ensure these environment variables are set on Render:
- `MAIN_ADMIN_USERNAME` - Default: "mainadmin"
- `MAIN_ADMIN_EMAIL` - Default: "admin@vesta.com"
- `MAIN_ADMIN_PASSWORD` - Default: "securePass123"

## Manual Admin Creation
If the automatic admin creation fails, you can manually create an admin using one of these scripts:

### On the Render server:
1. SSH into your Render instance
2. Run: `./ensure-admin.sh` or `./reset-admin.sh`

### On your local machine:
1. Run: `./ensure-admin.bat` or `./reset-admin-password.bat`

## Troubleshooting
If admin login still fails:
1. Check MongoDB connection in the server logs
2. Verify the admin account exists in the database
3. Run the test-api-working.ps1 script to diagnose specific API issues
4. Check the .env file to ensure it has the correct admin credentials

## Security Note
After deployment, change the default admin password immediately by logging in and updating the password through the admin interface.
