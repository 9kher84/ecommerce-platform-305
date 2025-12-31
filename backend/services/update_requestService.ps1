# PowerShell script to update requestService.js

$filePath = "c:\Users\s9khr\sasasa\ecommerce-platform\backend\services\requestService.js"
$helpersPath = "c:\Users\s9khr\sasasa\ecommerce-platform\backend\services\requestService_helpers.txt"
$getAllRequestsPath = "c:\Users\s9khr\sasasa\ecommerce-platform\backend\services\requestService_getAllRequests.txt"

# Read the original file
$content = Get-Content $filePath -Raw

# Read the helper functions
$helpers = Get-Content $helpersPath -Raw

# Read the new getAllRequests function
$newGetAllRequests = Get-Content $getAllRequestsPath -Raw

# Find the position to insert helpers (before getAllRequests)
$insertPosition = $content.IndexOf("  // =========================`r`n  // GET ALL REQUESTS (FOR HOMEPAGE)`r`n  // =========================")

if ($insertPosition -eq -1) {
    Write-Host "Could not find insertion point"
    exit 1
}

# Insert helpers before getAllRequests
$beforeHelpers = $content.Substring(0, $insertPosition)
$afterHelpers = $content.Substring($insertPosition)

# Find and replace the old getAllRequests function
$startMarker = "  // =========================`r`n  // GET ALL REQUESTS (FOR HOMEPAGE)`r`n  // ========================="
$endMarker = "  // GET PUBLISHED REQUESTS"

$startIndex = $afterHelpers.IndexOf($startMarker)
$endIndex = $afterHelpers.IndexOf($endMarker)

if ($startIndex -eq -1 -or $endIndex -eq -1) {
    Write-Host "Could not find function boundaries"
    exit 1
}

# Build new content
$beforeFunction = $afterHelpers.Substring(0, $startIndex)
$afterFunction = $afterHelpers.Substring($endIndex)

$newContent = $beforeHelpers + $helpers + "`r`n`r`n" + $newGetAllRequests + "`r`n`r`n  //" + $afterFunction

# Write the new content
Set-Content -Path $filePath -Value $newContent -NoNewline

Write-Host "File updated successfully"
