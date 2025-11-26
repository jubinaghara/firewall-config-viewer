# Script to rename downloaded font files to match expected names
$fontsDir = "public\fonts"

if (-not (Test-Path $fontsDir)) {
    Write-Host "Fonts directory not found: $fontsDir" -ForegroundColor Red
    exit 1
}

Write-Host "Renaming font files..." -ForegroundColor Green

# Rename Inter font files
$renameMap = @{
    "300.woff2" = "Inter-Light.woff2"
    "regular.woff2" = "Inter-Regular.woff2"
    "500.woff2" = "Inter-Medium.woff2"
    "600.woff2" = "Inter-SemiBold.woff2"
    "700.woff2" = "Inter-Bold.woff2"
}

foreach ($oldName in $renameMap.Keys) {
    $oldPath = Join-Path $fontsDir $oldName
    $newPath = Join-Path $fontsDir $renameMap[$oldName]
    
    if (Test-Path $oldPath) {
        if (Test-Path $newPath) {
            Write-Host "  [SKIP] $($renameMap[$oldName]) already exists" -ForegroundColor Yellow
        } else {
            Rename-Item -Path $oldPath -NewName $renameMap[$oldName] -Force
            Write-Host "  [OK] Renamed $oldName to $($renameMap[$oldName])" -ForegroundColor Green
        }
    } else {
        Write-Host "  [MISSING] $oldName not found" -ForegroundColor Red
    }
}

# Check Material Symbols
$materialPath = Join-Path $fontsDir "MaterialSymbolsOutlined.woff2"
if (Test-Path $materialPath) {
    Write-Host "  [OK] MaterialSymbolsOutlined.woff2 found" -ForegroundColor Green
} else {
    Write-Host "  [MISSING] MaterialSymbolsOutlined.woff2 not found" -ForegroundColor Red
}

Write-Host ""
Write-Host "Verifying all required files..." -ForegroundColor Cyan
$requiredFiles = @(
    "Inter-Light.woff2",
    "Inter-Regular.woff2",
    "Inter-Medium.woff2",
    "Inter-SemiBold.woff2",
    "Inter-Bold.woff2",
    "MaterialSymbolsOutlined.woff2"
)

$allPresent = $true
foreach ($file in $requiredFiles) {
    $filePath = Join-Path $fontsDir $file
    if (Test-Path $filePath) {
        Write-Host "  [OK] $file" -ForegroundColor Green
    } else {
        Write-Host "  [MISSING] $file" -ForegroundColor Red
        $allPresent = $false
    }
}

if ($allPresent) {
    Write-Host ""
    Write-Host "[SUCCESS] All required font files are present!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "[ERROR] Some font files are missing. Please download them." -ForegroundColor Red
}
