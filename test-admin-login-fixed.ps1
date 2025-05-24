# Test admin login functionality
# This script helps test the admin login endpoint on your Render backend

# Base URL configuration
$baseUrl = "https://vesta-btp1.onrender.com"
$apiUrl = "$baseUrl/api"
$adminLoginUrl = "$apiUrl/admin/login"

Write-Host "Vesta Admin Login Endpoint Tester" -ForegroundColor Cyan
Write-Host "----------------------------------" -ForegroundColor Cyan
Write-Host ""

# Admin credentials
$adminCredentials = @{
    email = "admin@vesta.com"
    password = "securePass123"
} | ConvertTo-Json

Write-Host "Testing admin login at: $adminLoginUrl" -ForegroundColor Yellow

try {
    $headers = @{
        "Content-Type" = "application/json"
    }

    Write-Host "Request Body:" -ForegroundColor Yellow
    Write-Host $adminCredentials -ForegroundColor Gray

    $response = Invoke-RestMethod -Uri $adminLoginUrl -Method POST -Body $adminCredentials -ContentType "application/json" -Headers $headers -ErrorAction Stop

    Write-Host "✓ Admin login successful" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Yellow
    $response | ConvertTo-Json -Depth 3 | Write-Host -ForegroundColor Gray

    if ($response.token) {
        Write-Host "Token received: $($response.token.Substring(0, 20))..." -ForegroundColor Green

        # Test authenticated endpoint with token
        $authHeader = @{
            "Authorization" = "Bearer $($response.token)"
            "Content-Type" = "application/json"
        }

        Write-Host ""
        Write-Host "Testing admin profile endpoint with token..." -ForegroundColor Yellow

        try {
            $profileResponse = Invoke-RestMethod -Uri "$apiUrl/admin/profile" -Method GET -Headers $authHeader -ErrorAction Stop
            Write-Host "✓ Admin profile endpoint accessible" -ForegroundColor Green
            $profileResponse | ConvertTo-Json -Depth 2 | Write-Host -ForegroundColor Gray
        }
        catch {
            $statusCode = $_.Exception.Response.StatusCode.value__

            Write-Host "✗ Admin profile endpoint test failed: Status $statusCode" -ForegroundColor Red

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
    $statusCode = $_.Exception.Response.StatusCode.value__

    Write-Host "✗ Admin login failed: Status $statusCode" -ForegroundColor Red

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
} # Closing for outer catch

Write-Host ""
Write-Host "Test completed" -ForegroundColor Cyan
