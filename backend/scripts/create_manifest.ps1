$source = "backend/reports"
$dest = "backend/reports/SOVEREIGN_FINAL_MANIFEST.zip"
$files = @(
    "sovereign_report_batch_1.md",
    "sovereign_report_batch_2.md",
    "sovereign_report_batch_3.md",
    "sovereign_report_transitional.md",
    "zero_vulnerability_audit.md"
)

# Create a temporary folder for the manifest
$tempDir = "backend/reports/manifest_temp"
New-Item -ItemType Directory -Force -Path $tempDir | Out-Null

foreach ($file in $files) {
    if (Test-Path "$source/$file") {
        Copy-Item "$source/$file" -Destination $tempDir
    }
}

# Add the Unsealing Protocol
Copy-Item "backend/docs/SOVEREIGN_UNSEALING_PROTOCOL.md" -Destination $tempDir

# Create Zip
Compress-Archive -Path "$tempDir/*" -DestinationPath $dest -Force

# Clean up
Remove-Item $tempDir -Recurse -Force

Write-Host "✅ Manifest Created: $dest"
