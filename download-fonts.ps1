# PowerShell script to download fonts for offline use
# This script downloads Inter and Material Symbols fonts from Google Fonts

$fontsDir = "public\fonts"
if (-not (Test-Path $fontsDir)) {
    New-Item -ItemType Directory -Path $fontsDir -Force | Out-Null
}

Write-Host "Downloading fonts for offline use..." -ForegroundColor Green

# Download Inter font files
Write-Host "Downloading Inter font..." -ForegroundColor Yellow
$interWeights = @("300", "400", "500", "600", "700")
$interNames = @("Light", "Regular", "Medium", "SemiBold", "Bold")

for ($i = 0; $i -lt $interWeights.Length; $i++) {
    $weight = $interWeights[$i]
    $name = $interNames[$i]
    $url = "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2"
    $output = "$fontsDir\Inter-$name.woff2"
    
    try {
        Invoke-WebRequest -Uri $url -OutFile $output -ErrorAction Stop
        Write-Host "  ✓ Downloaded Inter-$name.woff2" -ForegroundColor Green
    } catch {
        Write-Host "  ✗ Failed to download Inter-$name.woff2" -ForegroundColor Red
        Write-Host "    Error: $_" -ForegroundColor Red
    }
}

# Download Material Symbols Outlined
Write-Host "Downloading Material Symbols Outlined..." -ForegroundColor Yellow
$materialUrl = "https://fonts.gstatic.com/s/materialsymbolsoutlined/v179/kJEhBvYX7BgnkSrUwT8OhrdQw4oELdPIeeII9v6oFsI.woff2"
$materialOutput = "$fontsDir\MaterialSymbolsOutlined.woff2"

try {
    Invoke-WebRequest -Uri $materialUrl -OutFile $materialOutput -ErrorAction Stop
    Write-Host "  ✓ Downloaded MaterialSymbolsOutlined.woff2" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Failed to download MaterialSymbolsOutlined.woff2" -ForegroundColor Red
    Write-Host "    Error: $_" -ForegroundColor Red
}

Write-Host "`nFont download complete!" -ForegroundColor Green
Write-Host "Note: If downloads failed, you can manually download fonts from:" -ForegroundColor Yellow
Write-Host "  - Inter: https://fonts.google.com/specimen/Inter" -ForegroundColor Cyan
Write-Host "  - Material Symbols: https://fonts.google.com/icons" -ForegroundColor Cyan

