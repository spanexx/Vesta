# Test Media Uploads
# This script tests the verification document upload endpoint

param (
    [string]$UserId = "68317a29f0784f6b446c72ab",  # Replace with a valid user ID from your database
    [string]$Side = "front"
)

# Configuration
$baseUrl = "https://vesta-btp1.onrender.com"
$mediaUrl = "$baseUrl/api/media"
$verificationUrl = "$mediaUrl/verification-documents/$UserId/$Side"

Write-Host "Media Upload Tester" -ForegroundColor Cyan
Write-Host "-----------------" -ForegroundColor Cyan
Write-Host ""

# Create a simple test image (1x1 pixel transparent PNG)
$base64Image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="

# Create test payload
$payload = @{
    base64Data = "data:image/png;base64,$base64Image"
    filename = "test-document.png"
    contentType = "image/png"
} | ConvertTo-Json

Write-Host "Testing verification document upload to:" -ForegroundColor Yellow
Write-Host $verificationUrl -ForegroundColor Yellow
Write-Host ""

try {
    # First try to get an auth token (you'll need to implement this part)
    Write-Host "You need a valid authentication token to test this endpoint." -ForegroundColor Yellow
    Write-Host "Would you like to:" -ForegroundColor Yellow
    Write-Host "1. Use an existing token" -ForegroundColor Yellow
    Write-Host "2. Log in as admin to get a token" -ForegroundColor Yellow
    Write-Host "3. Skip authentication (will likely fail)" -ForegroundColor Yellow
    
    $choice = Read-Host "Enter your choice (1-3)"
    
    $authHeader = @{}
    
    if ($choice -eq "1") {
        $token = Read-Host "Enter your JWT token"
        $authHeader = @{
            "Authorization" = "Bearer $token"
        }
    }
    elseif ($choice -eq "2") {
        $adminCredentials = @{
            email = "admin@vesta.com"
            password = "securePass123"
        } | ConvertTo-Json
        
        $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/admin/login" -Method POST -Body $adminCredentials -ContentType "application/json"
        $token = $loginResponse.token
        $authHeader = @{
            "Authorization" = "Bearer $token"
        }
        Write-Host "Successfully logged in as admin and obtained token." -ForegroundColor Green
    }
    else {
        Write-Host "Proceeding without authentication (this will likely fail)." -ForegroundColor Yellow
    }
    
    # Make the request with headers
    $response = Invoke-RestMethod -Uri $verificationUrl -Method POST -Body $payload -ContentType "application/json" -Headers $authHeader
    
    Write-Host "✓ Success! Document uploaded successfully" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json -Depth 1)" -ForegroundColor Green
}
catch {
    Write-Host "✗ Upload failed" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "  Status Code: $statusCode" -ForegroundColor Red
        
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $reader.BaseStream.Position = 0
            $reader.DiscardBufferedData()
            $responseBody = $reader.ReadToEnd()
            Write-Host "  Response: $responseBody" -ForegroundColor Red
        }
        catch {
            Write-Host "  Could not read response body" -ForegroundColor Red
        }
    }
    else {
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Test completed" -ForegroundColor Cyan
