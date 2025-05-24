#!/bin/bash

# Build the Angular application
echo "Building Angular application..."
npm install --legacy-peer-deps
ng build --configuration=production

# Move built files to the dist folder
echo "Preparing files for deployment..."
cp _redirects dist/vesta-frontend/
cp render.yaml dist/vesta-frontend/
cp web.config dist/vesta-frontend/
cp .htaccess dist/vesta-frontend/

echo "Build completed successfully!"
