# Fixing Executable Icon (win-unpacked folder)

## Problem
- ✅ Installer shows correct icon (NSIS installer icon works)
- ❌ Executable in `win-unpacked` folder still shows React icon

This means electron-builder is not embedding the icon into the main `.exe` file.

## Solution Applied

I've updated the configuration to use `buildResources` directory:

```json
{
  "build": {
    "directories": {
      "output": "release",
      "buildResources": "build"  // ← Added this
    },
    "win": {
      "icon": "icon.ico"  // ← Now looks in buildResources (build/icon.ico)
    },
    "nsis": {
      "installerIcon": "icon.ico",  // ← Updated to match
      "uninstallerIcon": "icon.ico",
      "installerHeaderIcon": "icon.ico"
    }
  }
}
```

## Why This Should Work

When `buildResources` is set to `"build"`, electron-builder:
1. Looks for icons in the `build` folder
2. Uses `"icon.ico"` which resolves to `build/icon.ico`
3. Embeds the icon into the executable during build

## Next Steps

1. **Clean rebuild:**
   ```powershell
   # Clear all caches
   Remove-Item -Recurse -Force "$env:LOCALAPPDATA\electron-builder\Cache" -ErrorAction SilentlyContinue
   Remove-Item -Recurse -Force dist,release -ErrorAction SilentlyContinue
   
   # Rebuild
   npm run build
   npm run electron:build:win:installer
   ```

2. **Verify the executable:**
   - Navigate to `release\win-unpacked\`
   - Right-click `Sophos Firewall Config Viewer.exe` → Properties
   - Click "Change Icon" button
   - **You should see your icon in the list** (not React icon)

3. **If still showing React icon, try these alternatives:**

   **Option A: Use full path from project root**
   ```json
   "icon": "build/icon.ico"
   ```

   **Option B: Copy icon to public and use that**
   ```json
   "icon": "public/icon.ico"
   ```
   (Make sure `public/icon.ico` exists)

   **Option C: Use absolute path (last resort)**
   ```json
   "icon": "C:/full/path/to/your/project/build/icon.ico"
   ```

4. **Check build logs:**
   - Look for any warnings about icon not found
   - Check if electron-builder reports icon embedding

## Debugging

If the icon still doesn't embed, check:

1. **Icon file exists:**
   ```powershell
   Test-Path "build\icon.ico"
   ```

2. **Icon file is valid:**
   ```powershell
   .\verify-icon-file.ps1
   ```

3. **Check electron-builder version:**
   ```powershell
   npm list electron-builder
   ```
   - Should be 24.x or newer
   - Consider updating if very old

4. **Check build output for errors:**
   - Look for "icon" related warnings
   - Check if electron-builder finds the icon file

## Alternative: Manual Icon Embedding

If electron-builder still doesn't work, you can manually embed the icon after build using Resource Hacker or similar tools, but this is not recommended for production builds.





