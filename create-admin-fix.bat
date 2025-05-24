@echo off
echo Deploying admin fix to Render backend...

REM Create a temporary directory for the fix
mkdir admin-fix-temp
cd admin-fix-temp

REM Create the reset-admin.js file
echo import dotenv from 'dotenv'; > reset-admin.js
echo import mongoose from 'mongoose'; >> reset-admin.js
echo import Admin from './models/Admin.js'; >> reset-admin.js
echo import bcrypt from 'bcryptjs'; >> reset-admin.js
echo. >> reset-admin.js
echo dotenv.config(); >> reset-admin.js
echo. >> reset-admin.js
echo async function resetAdminPassword() { >> reset-admin.js
echo   try { >> reset-admin.js
echo     // Connect to MongoDB >> reset-admin.js
echo     await mongoose.connect(process.env.MONGODB_URI); >> reset-admin.js
echo     console.log('Connected to MongoDB'); >> reset-admin.js
echo. >> reset-admin.js
echo     // Find admin by email >> reset-admin.js
echo     const adminEmail = process.env.MAIN_ADMIN_EMAIL || 'admin@vesta.com'; >> reset-admin.js
echo     let admin = await Admin.findOne({ email: adminEmail }); >> reset-admin.js
echo. >> reset-admin.js
echo     if (admin) { >> reset-admin.js
echo       // Reset password >> reset-admin.js
echo       const password = process.env.MAIN_ADMIN_PASSWORD || 'adminpassword123'; >> reset-admin.js
echo       const hashedPassword = await bcrypt.hash(password, 12); >> reset-admin.js
echo       >> reset-admin.js
echo       admin.password = hashedPassword; >> reset-admin.js
echo       await admin.save(); >> reset-admin.js
echo       >> reset-admin.js
echo       console.log(`Password reset successfully for admin: ${admin.email}`); >> reset-admin.js
echo     } else { >> reset-admin.js
echo       // Create new admin if it doesn't exist >> reset-admin.js
echo       const newAdmin = new Admin({ >> reset-admin.js
echo         username: process.env.MAIN_ADMIN_USERNAME || 'mainadmin', >> reset-admin.js
echo         email: adminEmail, >> reset-admin.js
echo         password: process.env.MAIN_ADMIN_PASSWORD || 'adminpassword123', >> reset-admin.js
echo         permissions: { >> reset-admin.js
echo           canEditProfiles: true, >> reset-admin.js
echo           canDeleteProfiles: true, >> reset-admin.js
echo           canModerateContent: true, >> reset-admin.js
echo           canManageSubscriptions: true, >> reset-admin.js
echo           canCreateAdmin: true >> reset-admin.js
echo         } >> reset-admin.js
echo       }); >> reset-admin.js
echo. >> reset-admin.js
echo       await newAdmin.save(); >> reset-admin.js
echo       console.log(`Created new admin: ${newAdmin.email}`); >> reset-admin.js
echo     } >> reset-admin.js
echo. >> reset-admin.js
echo     console.log('Admin credentials:'); >> reset-admin.js
echo     console.log(`Email: ${adminEmail}`); >> reset-admin.js
echo     console.log(`Password: ${process.env.MAIN_ADMIN_PASSWORD || 'adminpassword123'}`); >> reset-admin.js
echo. >> reset-admin.js
echo   } catch (error) { >> reset-admin.js
echo     console.error('Error:', error); >> reset-admin.js
echo   } finally { >> reset-admin.js
echo     // Close MongoDB connection >> reset-admin.js
echo     await mongoose.connection.close(); >> reset-admin.js
echo     console.log('MongoDB connection closed'); >> reset-admin.js
echo     process.exit(0); >> reset-admin.js
echo   } >> reset-admin.js
echo } >> reset-admin.js
echo. >> reset-admin.js
echo resetAdminPassword(); >> reset-admin.js

REM Create a package.json file
echo { > package.json
echo   "name": "admin-fix", >> package.json
echo   "version": "1.0.0", >> package.json
echo   "type": "module", >> package.json
echo   "dependencies": { >> package.json
echo     "bcryptjs": "^2.4.3", >> package.json
echo     "dotenv": "^16.3.1", >> package.json
echo     "mongoose": "^8.12.1" >> package.json
echo   } >> package.json
echo } >> package.json

REM Create a README with instructions
echo # Admin Fix > README.md
echo. >> README.md
echo To fix the admin login issue: >> README.md
echo. >> README.md
echo 1. Upload these files to your Render service >> README.md
echo 2. Run: `node reset-admin.js` >> README.md
echo 3. This will reset or create the admin account with the credentials from your .env file >> README.md

echo.
echo Files created successfully.
echo.
echo Instructions:
echo 1. Upload these files to your Render service
echo 2. Run: node reset-admin.js
echo 3. This will reset or create the admin account with proper credentials
echo.
echo You can find these files in the admin-fix-temp directory.
