# PowerShell script to check if icon is properly embedded in the executable
Write-Host "=== Icon Embedding Diagnostic Script ===" -ForegroundColor Cyan
Write-Host ""

# Check if built executable exists
$exePath = "release\win-unpacked\Sophos Firewall Config Viewer.exe"
if (-not (Test-Path $exePath)) {
    Write-Host "✗ Executable not found at: $exePath" -ForegroundColor Red
    Write-Host "  Please build the application first:" -ForegroundColor Yellow
    Write-Host "    npm run build" -ForegroundColor Gray
    Write-Host "    npm run electron:build:win:installer" -ForegroundColor Gray
    exit 1
}

Write-Host "✓ Executable found: $exePath" -ForegroundColor Green
$exeFile = Get-Item $exePath
Write-Host "  Size: $($exeFile.Length) bytes" -ForegroundColor Gray
Write-Host "  Modified: $($exeFile.LastWriteTime)" -ForegroundColor Gray
Write-Host ""

# Check icon file
$iconPath = "build\icon.ico"
if (Test-Path $iconPath) {
    $iconFile = Get-Item $iconPath
    Write-Host "✓ Icon file found: $iconPath" -ForegroundColor Green
    Write-Host "  Size: $($iconFile.Length) bytes" -ForegroundColor Gray
    Write-Host "  Modified: $($iconFile.LastWriteTime)" -ForegroundColor Gray
} else {
    Write-Host "✗ Icon file NOT found at: $iconPath" -ForegroundColor Red
}

Write-Host ""

# Check if icon is embedded in executable
Write-Host "Checking if icon is embedded in executable..." -ForegroundColor Yellow
Write-Host ""

# Method 1: Check file properties
Write-Host "Method 1: Check executable properties" -ForegroundColor Cyan
Write-Host "  Right-click the executable → Properties → Details tab" -ForegroundColor White
Write-Host "  Look for 'Icon' or check if the icon displays correctly" -ForegroundColor White
Write-Host ""

# Method 2: Use PowerShell to extract icon info
Write-Host "Method 2: Attempting to read icon from executable..." -ForegroundColor Cyan
try {
    # Try to get the icon using .NET
    Add-Type -TypeDefinition @"
    using System;
    using System.Drawing;
    using System.Runtime.InteropServices;
    public class IconExtractor {
        [DllImport("shell32.dll", CharSet = CharSet.Auto)]
        public static extern IntPtr ExtractIcon(IntPtr hInst, string lpszExeFileName, int nIconIndex);
        [DllImport("user32.dll", CharSet = CharSet.Auto)]
        public static extern bool DestroyIcon(IntPtr hIcon);
    }
"@ -ErrorAction SilentlyContinue
    
    $iconPtr = [IconExtractor]::ExtractIcon([IntPtr]::Zero, (Resolve-Path $exePath).Path, 0)
    if ($iconPtr -ne [IntPtr]::Zero) {
        Write-Host "  ✓ Icon resource found in executable" -ForegroundColor Green
        [IconExtractor]::DestroyIcon($iconPtr)
    } else {
        Write-Host "  ✗ No icon resource found in executable" -ForegroundColor Red
        Write-Host "    This means the icon was NOT embedded during build!" -ForegroundColor Red
    }
} catch {
    Write-Host "  ⚠ Could not verify icon programmatically" -ForegroundColor Yellow
    Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Gray
}

Write-Host ""

# Check package.json configuration
Write-Host "Checking package.json configuration..." -ForegroundColor Yellow
$packageJson = Get-Content "package.json" | ConvertFrom-Json
$winIcon = $packageJson.build.win.icon
$nsisInstallerIcon = $packageJson.build.nsis.installerIcon

Write-Host "  win.icon: $winIcon" -ForegroundColor $(if ($winIcon) { "Green" } else { "Red" })
Write-Host "  nsis.installerIcon: $nsisInstallerIcon" -ForegroundColor $(if ($nsisInstallerIcon) { "Green" } else { "Red" })

# Verify icon path exists
if ($winIcon) {
    if (Test-Path $winIcon) {
        Write-Host "  ✓ Icon path '$winIcon' exists" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Icon path '$winIcon' does NOT exist!" -ForegroundColor Red
        Write-Host "    This is the problem! Fix the path in package.json" -ForegroundColor Red
    }
}

Write-Host ""

# Check installed version (if any)
Write-Host "Checking for installed version..." -ForegroundColor Yellow
$installPaths = @(
    "$env:ProgramFiles\Sophos Firewall Config Viewer\Sophos Firewall Config Viewer.exe",
    "${env:ProgramFiles(x86)}\Sophos Firewall Config Viewer\Sophos Firewall Config Viewer.exe",
    "$env:LOCALAPPDATA\Programs\Sophos Firewall Config Viewer\Sophos Firewall Config Viewer.exe"
)

$foundInstall = $false
foreach ($path in $installPaths) {
    if (Test-Path $path) {
        Write-Host "  ✓ Found installed version at: $path" -ForegroundColor Green
        $foundInstall = $true
        
        # Check if this executable has the icon
        Write-Host "    Check this executable's icon:" -ForegroundColor White
        Write-Host "      Right-click → Properties → Change Icon" -ForegroundColor Gray
        break
    }
}

if (-not $foundInstall) {
    Write-Host "  No installed version found (this is okay if testing)" -ForegroundColor Gray
}

Write-Host ""

# Recommendations
Write-Host "=== Recommendations ===" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $iconPath)) {
    Write-Host "1. ✗ CRITICAL: Icon file missing at build\icon.ico" -ForegroundColor Red
    Write-Host "   Copy your icon.ico file to the build\ folder" -ForegroundColor Yellow
    Write-Host ""
}

if ($winIcon -and -not (Test-Path $winIcon)) {
    Write-Host "2. ✗ CRITICAL: Icon path in package.json is incorrect" -ForegroundColor Red
    Write-Host "   Current path: $winIcon" -ForegroundColor Yellow
    Write-Host "   Fix the path in package.json to point to the correct icon file" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "3. If icon path is correct, try:" -ForegroundColor White
Write-Host "   a. Clean rebuild:" -ForegroundColor Gray
Write-Host "      Remove-Item -Recurse -Force dist,release" -ForegroundColor DarkGray
Write-Host "      npm run build" -ForegroundColor DarkGray
Write-Host "      npm run electron:build:win:installer" -ForegroundColor DarkGray
Write-Host ""
Write-Host "   b. Clear Windows icon cache:" -ForegroundColor Gray
Write-Host "      .\clear-icon-cache.bat" -ForegroundColor DarkGray
Write-Host ""
Write-Host "   c. After installing, manually check the executable:" -ForegroundColor Gray
Write-Host "      Navigate to: release\win-unpacked\" -ForegroundColor DarkGray
Write-Host "      Right-click 'Sophos Firewall Config Viewer.exe' → Properties" -ForegroundColor DarkGray
Write-Host "      If icon shows correctly here, the build is correct" -ForegroundColor DarkGray
Write-Host "      If it shows React icon, the icon was not embedded during build" -ForegroundColor DarkGray
Write-Host ""

Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

