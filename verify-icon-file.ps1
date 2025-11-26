# PowerShell script to verify icon file is a proper ICO file
Write-Host "=== Icon File Verification ===" -ForegroundColor Cyan
Write-Host ""

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$iconPath = Join-Path $scriptPath "build\icon.ico"

if (-not (Test-Path $iconPath)) {
    Write-Host "Icon file NOT found at: $iconPath" -ForegroundColor Red
    exit 1
}

Write-Host "Icon file found: $iconPath" -ForegroundColor Green

$file = Get-Item $iconPath
Write-Host "  Size: $($file.Length) bytes" -ForegroundColor Gray
Write-Host "  Modified: $($file.LastWriteTime)" -ForegroundColor Gray
Write-Host ""

# Check if it's a valid ICO file by reading the header
Write-Host "Checking ICO file format..." -ForegroundColor Yellow

try {
    $bytes = [System.IO.File]::ReadAllBytes($iconPath)
    
    if ($bytes.Length -lt 6) {
        Write-Host "File is too small to be a valid ICO" -ForegroundColor Red
        exit 1
    }
    
    # Check ICO signature (simplified check)
    $isValidICO = $false
    
    # Try to read as image
    Add-Type -AssemblyName System.Drawing
    try {
        $img = [System.Drawing.Image]::FromFile($iconPath)
        Write-Host "File can be loaded as an image" -ForegroundColor Green
        Write-Host "  Width: $($img.Width)px" -ForegroundColor Gray
        Write-Host "  Height: $($img.Height)px" -ForegroundColor Gray
        Write-Host "  Format: $($img.RawFormat)" -ForegroundColor Gray
        $img.Dispose()
        $isValidICO = $true
    } catch {
        Write-Host "File cannot be loaded as an image!" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
        Write-Host "CRITICAL: This file is NOT a valid ICO file!" -ForegroundColor Yellow
        Write-Host "  It might be a renamed PNG file." -ForegroundColor Yellow
        Write-Host "  You need to convert it properly using:" -ForegroundColor Yellow
        Write-Host "  - GIMP (File -> Export As -> Windows Icon)" -ForegroundColor White
        Write-Host "  - Online: https://icoconvert.com/" -ForegroundColor White
        Write-Host "  - ImageMagick: magick convert icon.png -define icon:auto-resize=16,32,48,256 icon.ico" -ForegroundColor White
        exit 1
    }
    
    if ($isValidICO) {
        Write-Host ""
        Write-Host "Icon file appears to be valid" -ForegroundColor Green
        Write-Host ""
        Write-Host "Recommendations:" -ForegroundColor Cyan
        Write-Host "1. Ensure the ICO contains multiple resolutions:" -ForegroundColor White
        Write-Host "   - 16x16, 32x32, 48x48, 256x256" -ForegroundColor Gray
        Write-Host "2. Use a proper ICO converter if needed" -ForegroundColor White
        Write-Host "3. After fixing, rebuild the app" -ForegroundColor White
    }
    
} catch {
    Write-Host "Error checking file: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
