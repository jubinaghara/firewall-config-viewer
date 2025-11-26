# PowerShell script to fix Windows icon issues
Write-Host "=== Windows Icon Fix Script ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if icon file exists
Write-Host "Step 1: Checking icon file..." -ForegroundColor Yellow
if (Test-Path "build\icon.ico") {
    $iconFile = Get-Item "build\icon.ico"
    Write-Host "✓ Icon file found: $($iconFile.FullName)" -ForegroundColor Green
    Write-Host "  Size: $($iconFile.Length) bytes" -ForegroundColor Gray
    Write-Host "  Modified: $($iconFile.LastWriteTime)" -ForegroundColor Gray
} else {
    Write-Host "✗ Icon file NOT found at build\icon.ico" -ForegroundColor Red
    Write-Host "  Please ensure build\icon.ico exists" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Clear electron-builder cache
Write-Host "Step 2: Clearing electron-builder cache..." -ForegroundColor Yellow
$cachePath = "$env:LOCALAPPDATA\electron-builder\Cache"
if (Test-Path $cachePath) {
    Remove-Item -Path $cachePath -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "✓ Electron-builder cache cleared" -ForegroundColor Green
} else {
    Write-Host "  No cache found (this is okay)" -ForegroundColor Gray
}

Write-Host ""

# Step 3: Clear Windows icon cache
Write-Host "Step 3: Clearing Windows icon cache..." -ForegroundColor Yellow
Write-Host "  This requires restarting Windows Explorer..." -ForegroundColor Gray

# Stop Windows Explorer
try {
    Stop-Process -Name "explorer" -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    Write-Host "  ✓ Windows Explorer stopped" -ForegroundColor Green
} catch {
    Write-Host "  ⚠ Could not stop Windows Explorer (may need admin rights)" -ForegroundColor Yellow
}

# Clear icon cache files
$iconCachePaths = @(
    "$env:LOCALAPPDATA\IconCache.db",
    "$env:LOCALAPPDATA\Microsoft\Windows\Explorer\iconcache*.db",
    "$env:LOCALAPPDATA\Microsoft\Windows\Explorer\thumbcache_*.db"
)

foreach ($path in $iconCachePaths) {
    if ($path -like "*`**") {
        # Handle wildcards
        Get-ChildItem -Path ($path -replace '\*', '*') -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue
    } else {
        if (Test-Path $path) {
            Remove-Item -Path $path -Force -ErrorAction SilentlyContinue
        }
    }
}

Write-Host "  ✓ Icon cache files cleared" -ForegroundColor Green

# Restart Windows Explorer
Start-Process "explorer.exe"
Start-Sleep -Seconds 2
Write-Host "  ✓ Windows Explorer restarted" -ForegroundColor Green

Write-Host ""
Write-Host "=== Next Steps ===" -ForegroundColor Cyan
Write-Host "1. Clean build folders:" -ForegroundColor White
Write-Host "   Remove-Item -Recurse -Force dist,release -ErrorAction SilentlyContinue" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Rebuild the application:" -ForegroundColor White
Write-Host "   npm run build" -ForegroundColor Gray
Write-Host "   npm run electron:build:win:installer" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Uninstall the old version completely" -ForegroundColor White
Write-Host ""
Write-Host "4. Install the new version" -ForegroundColor White
Write-Host ""
Write-Host "5. If icon still doesn't update, restart your computer" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")






