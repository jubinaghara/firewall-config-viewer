# Final Icon Fix Guide - Based on Electron Forge Best Practices

Based on the [Electron Forge Icon Guide](https://www.electronforge.io/guides/create-and-add-icons), here are the critical steps to fix your Windows icon issue:

## Critical Issue: Icon File Format

**⚠️ IMPORTANT:** According to the Electron Forge guide:
> "On Windows, ensure that your `.ico` file is exported from an image editor that supports the format (such as GIMP). **Renaming a `.png` file into `.ico` will result in a `Fatal error: Unable to set icon` error.**"

### Step 1: Verify Your Icon File

Run the verification script:
```powershell
.\verify-icon-file.ps1
```

**If the icon file is invalid:**
1. Use GIMP, ImageMagick, or an online converter to create a proper ICO file
2. Recommended tool: https://icoconvert.com/
3. Ensure it contains multiple resolutions: 16x16, 32x32, 48x48, 256x256

### Step 2: Icon Path Configuration

I've updated your `package.json` to use `"icon": "build/icon"` (without extension) for the main Windows icon, as electron-builder may add the extension automatically. The NSIS installer icons still use the full path with `.ico` extension.

### Step 3: Clean Rebuild

```powershell
# Clear all caches
Remove-Item -Recurse -Force "$env:LOCALAPPDATA\electron-builder\Cache" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force dist,release -ErrorAction SilentlyContinue

# Rebuild
npm run build
npm run electron:build:win:installer
```

### Step 4: Refresh Windows Icon Cache

According to the Electron Forge guide, use:
```powershell
ie4uinit.exe -show
```

Or manually:
1. Press `Win + R`
2. Type: `ie4uinit.exe -show`
3. Press Enter

Alternatively:
1. Open Task Manager (`Ctrl + Shift + Esc`)
2. Find "Windows Explorer"
3. Right-click → Restart

### Step 5: Verify Icon is Embedded

After building, check the executable:
1. Navigate to `release\win-unpacked\`
2. Right-click `Sophos Firewall Config Viewer.exe` → Properties
3. Click "Change Icon" button
4. **You should see your icon in the list**

If you see the React/Electron icon here, the icon was NOT embedded during build.

### Step 6: Complete Uninstall and Reinstall

1. **Uninstall completely** from Control Panel
2. **Delete remaining folders:**
   - `C:\Program Files\Sophos Firewall Config Viewer\`
   - `C:\Users\<YourUser>\AppData\Local\Sophos Firewall Config Viewer\`
3. **Clear icon cache** (Step 4)
4. **Restart your computer** (recommended)
5. **Install fresh** from the new installer

## Alternative: Try Icon Without Extension

If the icon still doesn't work, electron-builder might need the path without extension. I've already updated `win.icon` to `"build/icon"` (without `.ico`). 

If that doesn't work, try these alternatives in `package.json`:

**Option 1:** Full path from project root
```json
"icon": "./build/icon.ico"
```

**Option 2:** Just filename (if icon is in buildResources)
```json
"icon": "icon"
```

**Option 3:** Absolute path (not recommended, but works)
```json
"icon": "C:/full/path/to/build/icon.ico"
```

## Troubleshooting Checklist

- [ ] Icon file is a proper ICO (not renamed PNG) - verified with `verify-icon-file.ps1`
- [ ] Icon file exists at `build/icon.ico`
- [ ] Clean rebuild completed (dist and release folders deleted)
- [ ] electron-builder cache cleared
- [ ] Windows icon cache refreshed (`ie4uinit.exe -show`)
- [ ] Old version completely uninstalled
- [ ] Computer restarted (if icon still doesn't update)
- [ ] Executable shows correct icon in Properties → Change Icon
- [ ] Desktop shortcut deleted and recreated by installer

## Still Not Working?

If after all these steps the icon still shows as React icon:

1. **Check the executable directly:**
   - `release\win-unpacked\Sophos Firewall Config Viewer.exe`
   - Right-click → Properties → Change Icon
   - If it shows React icon here, the build failed to embed the icon

2. **Try a different icon file:**
   - Create a new ICO file from scratch
   - Use a known-good icon file to test
   - Verify it works in Windows Explorer first

3. **Check electron-builder version:**
   ```powershell
   npm list electron-builder
   ```
   - Consider updating if very old
   - Current version should be 24.x or newer

4. **Check build logs:**
   - Look for any icon-related errors during build
   - Check if electron-builder reports icon embedding

## Reference

- [Electron Forge Icon Guide](https://www.electronforge.io/guides/create-and-add-icons)
- [electron-builder Icon Configuration](https://www.electron.build/configuration/configuration#win-icon)

