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
        $response = Invoke-RestMethod -Uri $Url -Method $Method -ErrorAction Stop
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
    
    # Store the token for further API tests
    $adminToken = $loginResponse.token
}
catch {
    Write-Host "✗ Admin login failed" -ForegroundColor Red
    $statusCode = $_.Exception.Response.StatusCode.value__
    $details = $_.ErrorDetails.Message
    Write-Host "  Status: $statusCode" -ForegroundColor Red
    Write-Host "  Details: $details" -ForegroundColor Red
}

Write-Host ""
Write-Host "Endpoint testing completed" -ForegroundColor Cyan
