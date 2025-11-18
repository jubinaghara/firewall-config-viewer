# Building Windows Executables from WSL2

## Problem

When building Windows executables from WSL2, you may encounter errors related to code signing which requires Wine. This guide provides solutions.

## Solution 1: Disable Code Signing (Recommended for WSL)

The build configuration has been updated to skip code signing. The build should now work without Wine.

**Important:** The executable will still work perfectly, but Windows may show a warning on first run about an "Unknown Publisher". This is normal for unsigned applications.

## Solution 2: Build on Actual Windows (Best Option)

For the best results and proper code signing (optional), build on actual Windows:

1. Copy the project to your Windows file system (not WSL)
2. Open PowerShell or Command Prompt on Windows
3. Run:
   ```cmd
   npm install
   npm run electron:build:win
   ```

## Solution 3: Use Portable Build (No Installer)

If you want to skip the installer entirely and just create a portable executable:

Update `package.json` win target to:
```json
"win": {
  "target": ["portable"],
  "arch": ["x64"]
}
```

This creates a single `.exe` file that doesn't require installation.

## Current Configuration

The current setup:
- ✅ Skips code signing (no Wine required)
- ✅ Creates NSIS installer
- ✅ Works from WSL2
- ⚠️  Windows may show "Unknown Publisher" warning (safe to ignore)

## After Building

1. Find your executable in `release/` folder
2. The `.exe` file is ready to distribute
3. Users may need to:
   - Right-click → Properties → Unblock (if downloaded)
   - Click "More info" → "Run anyway" on first launch

## Alternative: Use Windows PowerShell

If you have access to Windows PowerShell directly:

1. Exit WSL
2. Open PowerShell on Windows
3. Navigate to your project folder
4. Run the build commands

This avoids all WSL/Wine complications.

