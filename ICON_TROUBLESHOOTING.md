# Windows Icon Troubleshooting Guide

If your desktop shortcut and taskbar icon still show the React/Electron icon after fixing the configuration, try these solutions:

## Issue Fixed: Icon Path Configuration

**Problem:** Your `buildResources` was set to `"build"` but icon paths pointed to `"public/icon.ico"`. electron-builder looks in the `buildResources` directory first.

**Solution Applied:** Changed all icon paths to `"icon.ico"` which electron-builder will find in the `build` directory (your buildResources).

## Additional Issues to Check

### 1. **Windows Icon Cache (Most Common Issue)**

Windows aggressively caches icons. Even after rebuilding, the old icon may persist.

**Solution:**
```powershell
# Run as Administrator
# Stop Windows Explorer
taskkill /f /im explorer.exe

# Clear icon cache
del /a /q /f "%LOCALAPPDATA%\IconCache.db" 2>nul
del /a /q /f "%LOCALAPPDATA%\Microsoft\Windows\Explorer\iconcache*.db" 2>nul
del /a /q /f "%LOCALAPPDATA%\Microsoft\Windows\Explorer\thumbcache_*.db" 2>nul

# Restart Explorer
start explorer.exe

# Or use the provided script:
.\clear-icon-cache.bat
```

**After clearing cache:**
1. Delete the old desktop shortcut
2. Uninstall the old version completely
3. Rebuild and reinstall
4. If still not working, restart your computer

### 2. **Shortcut Has Hardcoded Icon Path**

The shortcut itself might have the old icon path stored.

**Solution:**
1. Right-click the desktop shortcut → Properties
2. Click "Change Icon"
3. Browse to: `C:\Program Files\Sophos Firewall Config Viewer\Sophos Firewall Config Viewer.exe`
4. Select the executable and click OK
5. Click OK to save

Or simply delete and recreate the shortcut after reinstalling.

### 3. **Icon File Format Issues**

The `.ico` file must be a proper multi-resolution ICO file, not just a renamed PNG.

**Check:**
- Open `build/icon.ico` in Windows - it should display correctly
- The file should contain multiple sizes: 16x16, 32x32, 48x48, 256x256

**If the icon file is invalid:**
- Use a tool like IcoFX, GIMP, or online converters to create a proper multi-resolution ICO file
- Ensure it contains at least: 16x16, 32x32, 48x48, 256x256

### 4. **Executable Icon Not Embedded**

The icon might not be properly embedded in the `.exe` file.

**Check:**
1. Navigate to `release/win-unpacked/`
2. Right-click `Sophos Firewall Config Viewer.exe` → Properties
3. Check the "Details" tab - does it show your icon?

**If not:**
- Clean rebuild: Delete `dist` and `release` folders
- Rebuild: `npm run build && npm run electron:build:win:installer`
- Verify the icon is embedded in the new executable

### 5. **App User Model ID Mismatch**

Windows uses App User Model ID to identify apps. If it changed, Windows might show the old icon.

**Check in `electron/main.js`:**
```javascript
app.setAppUserModelId('com.firewallconfigviewer.app')
```

**Must match `package.json`:**
```json
"appId": "com.firewallconfigviewer.app"
```

### 6. **Build Cache Issues**

electron-builder might be using cached files.

**Solution:**
```powershell
# Clear electron-builder cache
Remove-Item -Recurse -Force "$env:LOCALAPPDATA\electron-builder\Cache"

# Clean build folders
Remove-Item -Recurse -Force dist,release -ErrorAction SilentlyContinue

# Rebuild
npm run build
npm run electron:build:win:installer
```

### 7. **Installation Location**

If you installed to a different location, Windows might be using an old cached icon from the previous location.

**Solution:**
1. Uninstall completely from Control Panel
2. Manually delete any remaining folders in:
   - `C:\Program Files\Sophos Firewall Config Viewer\`
   - `C:\Users\<YourUser>\AppData\Local\Sophos Firewall Config Viewer\`
3. Clear icon cache (see #1)
4. Reinstall fresh

### 8. **Taskbar Pinning**

If the app is pinned to the taskbar, Windows might be using the old pinned icon.

**Solution:**
1. Unpin from taskbar (right-click → Unpin)
2. Clear icon cache
3. Reinstall
4. Pin again

### 9. **Verify Icon in Build Folder**

Ensure `build/icon.ico` exists and is the correct file:

```powershell
# Check if file exists
Test-Path "build\icon.ico"

# Check file size (should be > 0)
(Get-Item "build\icon.ico").Length

# Verify it's a valid ICO file
# Open it in Windows - should display your icon
```

### 10. **Complete Rebuild Checklist**

Follow this complete process:

1. ✅ **Update package.json** (already done - icon paths set to `"icon.ico"`)
2. ✅ **Verify `build/icon.ico` exists** and is valid
3. ✅ **Clear electron-builder cache**: `Remove-Item -Recurse -Force "$env:LOCALAPPDATA\electron-builder\Cache"`
4. ✅ **Clean build folders**: `Remove-Item -Recurse -Force dist,release`
5. ✅ **Clear Windows icon cache** (see #1)
6. ✅ **Uninstall old version** completely
7. ✅ **Rebuild**: `npm run build && npm run electron:build:win:installer`
8. ✅ **Verify executable icon**: Check `release/win-unpacked/Sophos Firewall Config Viewer.exe` properties
9. ✅ **Install fresh** from the new installer
10. ✅ **Delete old shortcuts** and let installer create new ones
11. ✅ **Restart computer** if icon still doesn't update

## Quick Test

After rebuilding, before installing:

1. Navigate to `release/win-unpacked/`
2. Right-click `Sophos Firewall Config Viewer.exe` → Properties
3. If the icon shows correctly here, the build is correct
4. If it still shows React icon, the icon file or build configuration is wrong

## Still Not Working?

If after all these steps the icon still doesn't update:

1. **Check the actual executable** in `release/win-unpacked/` - does it have the correct icon?
2. **Try a different icon file** - maybe the current one is corrupted
3. **Check Windows Event Viewer** for any errors during installation
4. **Try installing to a different location** or different user account
5. **Verify you're not running a portable version** - portable versions handle icons differently

## Contact

If none of these solutions work, the issue might be:
- Windows version-specific behavior
- Antivirus/security software interfering
- File permissions issue
- Icon file corruption

