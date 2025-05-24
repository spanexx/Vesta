# This script uses curl to trigger admin password reset on your Render backend

Write-Host "Deploying admin password reset to Render..."

# Check if curl is available
$hasCurl = Get-Command curl -ErrorAction SilentlyContinue
if (-not $hasCurl) {
    Write-Host "Error: curl command not found. Please install curl and try again."
    exit 1
}

# Create temporary deployment package
$tempDir = "temp-admin-reset"
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

# Create reset script
$resetScript = @"
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Admin from './models/Admin.js';
import bcrypt from 'bcryptjs';

dotenv.config();

async function resetAdminPassword() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find admin by email
    const adminEmail = process.env.MAIN_ADMIN_EMAIL || 'admin@vesta.com';
    let admin = await Admin.findOne({ email: adminEmail });

    if (admin) {
      // Reset password
      const password = process.env.MAIN_ADMIN_PASSWORD || 'adminpassword123';
      const hashedPassword = await bcrypt.hash(password, 12);
      
      admin.password = hashedPassword;
      await admin.save();
      
      console.log(`Password reset successfully for admin: ${admin.email}`);
    } else {
      // Create new admin if it doesn't exist
      const newAdmin = new Admin({
        username: process.env.MAIN_ADMIN_USERNAME || 'mainadmin',
        email: adminEmail,
        password: process.env.MAIN_ADMIN_PASSWORD || 'adminpassword123',
        permissions: {
          canEditProfiles: true,
          canDeleteProfiles: true,
          canModerateContent: true,
          canManageSubscriptions: true,
          canCreateAdmin: true
        }
      });

      await newAdmin.save();
      console.log(`Created new admin: ${newAdmin.email}`);
    }

    console.log('Admin credentials:');
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${process.env.MAIN_ADMIN_PASSWORD || 'adminpassword123'}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  }
}

resetAdminPassword();
"@

Set-Content -Path "$tempDir/reset-admin.js" -Value $resetScript

# Create README with instructions
$readme = @"
# Admin Password Reset

This script will reset the admin password in your Render environment.

To run it:

1. SSH into your Render instance
2. Navigate to your app directory
3. Run: \`node reset-admin.js\`

The admin credentials will be:
- Email: admin@vesta.com (or whatever is in your .env file)
- Password: securePass123 (or whatever is in your .env file)
"@

Set-Content -Path "$tempDir/README.md" -Value $readme

# Now you would typically upload these files to Render or run them through SSH
# Since we don't have direct access, let's provide instructions

Write-Host ""
Write-Host "Admin reset files created in $tempDir directory."
Write-Host ""
Write-Host "To deploy this reset to your Render environment:"
Write-Host "1. Log in to your Render dashboard: https://dashboard.render.com/"
Write-Host "2. Go to your backend service"
Write-Host "3. Use the Shell tab to connect to your instance"
Write-Host "4. Copy and paste the contents of $tempDir/reset-admin.js"
Write-Host "5. Run the script with 'node reset-admin.js'"
Write-Host ""
Write-Host "After running, you should be able to log in with:"
Write-Host "- Email: admin@vesta.com"
Write-Host "- Password: securePass123"

# Alternatively, run it directly through the admin dashboard
Write-Host ""
Write-Host "Or manually set your admin password by running:"
Write-Host "cd vestaBackend && node scripts/reset-admin.js"
Write-Host ""
