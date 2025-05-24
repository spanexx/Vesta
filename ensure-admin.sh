#!/bin/bash
# filepath: c:\Users\shuga\OneDrive\Desktop\Vesta\vesta-repo\Vesta\ensure-admin.sh

# Ensure admin exists in the database
echo "Ensuring admin account exists..."

# Change to backend directory
cd vestaBackend

# Run the ensure-admin script
node scripts/ensure-admin.js

echo "Admin verification completed."

# Make sure this file uses LF line endings when deployed to Linux
