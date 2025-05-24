# Test API endpoints script
# This script helps test various endpoints on your Render backend

# Base URL configuration
$baseUrl = "https://vesta-btp1.onrender.com"
$apiUrl = "$baseUrl/api"
$mediaUrl = "$apiUrl/media"

Write-Host "Vesta API Endpoint Tester" -ForegroundColor Cyan
Write-Host "------------------------" -ForegroundColor Cyan
Write-Host ""

function Test-Endpoint {
    param (
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET"
    )
    
    Write-Host "Testing $Name endpoint: $Url" -ForegroundColor Yellow
    
    try {
        Invoke-RestMethod -Uri $Url -Method $Method -ErrorAction Stop
        Write-Host "✓ Success: Endpoint is accessible" -ForegroundColor Green
        return $true
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $statusDescription = $_.Exception.Response.StatusDescription
        
        Write-Host "✗ Failed: Status $statusCode - $statusDescription" -ForegroundColor Red
        return $false
    }
}

# Test main API endpoints
$endpoints = @(
    @{Name="Backend Root"; Url="$baseUrl"},
    @{Name="API Root"; Url="$apiUrl/test-cors"},
    @{Name="Media API"; Url="$mediaUrl"}
)

$allOk = $true
foreach ($endpoint in $endpoints) {
    $result = Test-Endpoint -Name $endpoint.Name -Url $endpoint.Url
    $allOk = $allOk -and $result
    Write-Host ""
}

if (-not $allOk) {
    Write-Host "Some endpoints are not accessible. Please check your Render deployment." -ForegroundColor Red
}

# Test admin login
Write-Host "Testing Admin Login..." -ForegroundColor Yellow

$adminCredentials = @{
    email = "admin@vesta.com"
    password = "securePass123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$apiUrl/admin/login" -Method POST -Body $adminCredentials -ContentType "application/json" -ErrorAction Stop
    Write-Host "✓ Admin login successful" -ForegroundColor Green
    Write-Host "Token received: $($loginResponse.token.Substring(0, 20))..." -ForegroundColor Green
    
    # Use this token to test an authenticated endpoint
    $token = $loginResponse.token
    $adminToken = $token  # Assign to adminToken variable for later use
    
    # Ask if user wants to test an authenticated endpoint
    Write-Host ""
    Write-Host "Would you like to test an authenticated endpoint? (y/n)" -ForegroundColor Yellow
    $testAuth = Read-Host
    
    if ($testAuth -eq 'y') {
        $authHeader = @{
            "Authorization" = "Bearer $token"
        }
        
        # Test media endpoint with authentication
        Write-Host ""
        Write-Host "Testing media endpoint with authentication..." -ForegroundColor Yellow
        try {
            Invoke-RestMethod -Uri "$mediaUrl/verification-documents" -Method GET -Headers $authHeader -ErrorAction Stop
            Write-Host "✓ Media endpoint accessible with authentication" -ForegroundColor Green
        }
        catch {
            $statusCode = $_.Exception.Response.StatusCode.value__
            $statusDescription = $_.Exception.Response.StatusDescription
            
            Write-Host "✗ Media endpoint test failed: Status $statusCode - $statusDescription" -ForegroundColor Red
            
            # Try to get response body for more details
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
    }
}
catch {
    Write-Host "✗ Admin login failed" -ForegroundColor Red
    $statusCode = $_.Exception.Response.StatusCode.value__
    $details = $_.ErrorDetails.Message
    Write-Host "  Status: $statusCode" -ForegroundColor Red
    Write-Host "  Details: $details" -ForegroundColor Red
}

Write-Host ""

# Test authenticated endpoints if we have an admin token
if ($adminToken) {
    Write-Host "Testing authenticated endpoints..." -ForegroundColor Yellow
    
    # Test authenticated admin endpoint
    try {
        $headers = @{
            "Authorization" = "Bearer $adminToken"
        }
        
        $adminProfileResponse = Invoke-RestMethod -Uri "$apiUrl/admin/profile" -Method GET -Headers $headers -ErrorAction Stop
        Write-Host "✓ Admin profile endpoint accessible" -ForegroundColor Green
        Write-Host "  Admin ID: $($adminProfileResponse._id)" -ForegroundColor Green
    }
    catch {
        Write-Host "✗ Admin profile endpoint failed" -ForegroundColor Red
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "  Status: $statusCode" -ForegroundColor Red
    }
    
    # Test users listing endpoint (admin only)
    try {
        $headers = @{
            "Authorization" = "Bearer $adminToken"
        }
        
        $usersResponse = Invoke-RestMethod -Uri "$apiUrl/admin/users" -Method GET -Headers $headers -ErrorAction Stop
        Write-Host "✓ Users listing endpoint accessible" -ForegroundColor Green
        Write-Host "  Total users: $($usersResponse.Count)" -ForegroundColor Green
    }
    catch {
        Write-Host "✗ Users listing endpoint failed" -ForegroundColor Red
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "  Status: $statusCode" -ForegroundColor Red
    }
}
else {
    Write-Host "Skipping authenticated endpoint tests (no valid admin token)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Endpoint testing completed" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Magenta
Write-Host "1. If admin login failed, run one of these admin scripts:" -ForegroundColor Magenta
Write-Host "   - On local environment: .\ensure-admin.bat" -ForegroundColor Magenta
Write-Host "   - On local environment (alt): .\reset-admin-password.bat" -ForegroundColor Magenta
Write-Host "   - On Render: .\ensure-admin.sh or .\reset-admin.sh" -ForegroundColor Magenta
Write-Host "2. If media endpoints are failing, check:" -ForegroundColor Magenta
Write-Host "   - Routes in vestaBackend/routes/media.js" -ForegroundColor Magenta
Write-Host "   - Middleware in vestaBackend/server.js" -ForegroundColor Magenta
Write-Host "   - Environment URLs in src/environments/environment.prod.ts" -ForegroundColor Magenta
Write-Host "3. For more detailed media testing run:" -ForegroundColor Magenta
Write-Host "   .\test-media-upload.ps1" -ForegroundColor Magenta
