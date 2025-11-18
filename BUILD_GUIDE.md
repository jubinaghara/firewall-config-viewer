# Build Guide - Firewall Config Viewer

This guide explains how to build standalone executables for Windows (.exe) and macOS (.app) using Electron.

> **Want to customize the app name, icon, or branding?** See [BRANDING_GUIDE.md](./BRANDING_GUIDE.md) for detailed instructions.

## Prerequisites

1. **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
2. **npm** (comes with Node.js)
3. **For Windows builds:** Can be built on Windows, macOS, or Linux/WSL
4. **For macOS builds:** ⚠️ **MUST be built on macOS** - Cannot be built on Windows or WSL/Linux

## Installation

First, install all dependencies:

```bash
npm install
```

## Build Commands

### Windows Builds

#### ⭐ Windows Installer (.exe - RECOMMENDED) ⭐
**Best option for distribution!** Creates a single `.exe` installer file that includes all dependencies. Users simply double-click to install.

```bash
npm run electron:build:win:installer
```

Output: `release/Firewall Config Viewer-Setup-1.0.0.exe` (Single installer file)

**Why this is recommended:**
- ✅ Single `.exe` file - easy to share
- ✅ Includes all dependencies (no missing DLL errors)
- ✅ Professional installer experience
- ✅ Creates Start Menu and Desktop shortcuts
- ✅ Users can choose installation location
- ✅ Most reliable and user-friendly option

**How to share:** Just share the single `.exe` file. Users double-click it to install.

**⚠️ Building from WSL/Linux:** 
- ⚠️ **WARNING:** NSIS installers built from WSL/Wine are often **corrupted and won't work** (installer runs but does nothing)
- **Recommended:** Build on Windows natively for reliable installers
- **Alternative:** Use the directory build option (no Wine needed, works reliably from WSL)
- See [Wine Error troubleshooting](#wine-error-building-windows-from-linuxwsl) below for more details

---

#### Portable Executable (.exe - No Installation Required)
Creates a standalone `.exe` file that can be run directly without installation:

```bash
npm run electron:build:win:portable
```

Output: `release/Firewall Config Viewer-1.0.0-portable.exe`

**Note:** If you encounter `ffmpeg.dll` errors with the portable build, use the NSIS installer instead (recommended above).

#### Directory Build (No Wine Required - Good for WSL) ⭐
Creates an unpacked directory that you can zip and share. This doesn't require Wine and works reliably from WSL:

```bash
npm run electron:build:win:dir
```

Output: `release/win-unpacked/` folder

**How to share:** 
1. Build from WSL: `npm run electron:build:win:dir`
2. Zip the folder from Windows PowerShell:
   ```powershell
   cd release
   Compress-Archive -Path "win-unpacked\*" -DestinationPath "Firewall-Config-Viewer-Portable.zip"
   ```
3. Share the zip file - Users extract it and run `Firewall Config Viewer.exe` from the extracted folder

**Advantages:**
- ✅ No Wine required (works in WSL/Linux)
- ✅ Works reliably from WSL (unlike NSIS installer)
- ✅ All files included
- ✅ Portable (no installation needed)
- ✅ User-friendly (just extract and run)

#### Standard Windows Build
Builds both portable and installer versions:

```bash
npm run electron:build:win
```

### macOS Builds

⚠️ **IMPORTANT:** macOS builds **MUST be run on a macOS machine**. They cannot be built on Windows or WSL/Linux.

#### Standard macOS Build
Creates a `.dmg` file and `.zip` for macOS:

```bash
npm run electron:build:mac
```

Output: 
- `release/Firewall Config Viewer-1.0.0-x64.dmg`
- `release/Firewall Config Viewer-1.0.0-x64.zip`

#### Apple Silicon (M1/M2/M3) Build
Builds specifically for ARM64 architecture:

```bash
npm run electron:build:mac:arm64
```

**Note:** Must be run on macOS.

#### Universal Binary (Intel + Apple Silicon)
Builds a universal binary that works on both Intel and Apple Silicon Macs:

```bash
npm run electron:build:mac:universal
```

**Note:** Must be run on macOS.

### Build for All Platforms

Builds for both Windows and macOS (must be run on macOS for Mac builds):

```bash
npm run electron:build:all
```

## Output Location

All built executables will be in the `release/` directory:

```
release/
├── Firewall Config Viewer-Setup-1.0.0.exe     (Windows installer - RECOMMENDED ⭐)
├── Firewall Config Viewer-1.0.0-portable.exe  (Windows portable)
├── Firewall Config Viewer-1.0.0-x64.dmg       (macOS disk image)
└── Firewall Config Viewer-1.0.0-x64.zip       (macOS zip)
```

## Development

### Run in Development Mode

To run the app in development mode with hot-reload:

```bash
npm run electron:dev
```

This will:
1. Start the Vite dev server
2. Launch Electron when the server is ready
3. Enable DevTools automatically

### Run Production Build Locally

To test the production build locally:

```bash
npm run build
npm run electron
```

## Icon Setup

The application uses the icon from `public/sophos-favicon.ico` for all platforms. This is automatically configured in the build settings.

**Note for macOS**: If you encounter icon issues on macOS, you may need to convert the `.ico` file to `.icns` format. You can use online converters or tools like `iconutil` on macOS.

## Troubleshooting

### Windows Build Issues

#### Missing DLL Error (ffmpeg.dll, etc.)

If you get an error like "ffmpeg.dll was not found", try these solutions:

1. **Use the directory build first to verify all files are included:**
   ```bash
   npm run electron:build:win:dir
   ```
   This creates an unpacked directory in `release/win-unpacked/` with all files. Test if the `.exe` in that directory works.

2. **If the directory build works, rebuild the portable:**
   ```bash
   npm run electron:build:win:portable
   ```

3. **Clean and rebuild:**
   ```bash
   # Delete release folder and node_modules/.cache
   rm -rf release node_modules/.cache
   npm run electron:build:win:portable
   ```

4. **Use the NSIS installer instead (more reliable):**
   ```bash
   npm run electron:build:win:installer
   ```
   The installer includes all necessary files and is more reliable than portable builds.

#### Wine Error (Building Windows from Linux/WSL)

**Error:** `wine is required, please see https://electron.build/multi-platform-build#linux`

**Why this happens:** Building NSIS installers (`.exe` installers) from WSL/Linux requires Wine because NSIS is a Windows tool. This is different from code signing - Wine is needed to run the NSIS compiler.

**Solutions (choose one):**

##### Option 1: Install Wine (Recommended for NSIS Installer)

Install Wine in WSL/Linux:

```bash
# On Ubuntu/Debian WSL
sudo apt-get update
sudo apt-get install -y wine64 wine32

# Verify installation
wine --version
```

Then build the installer:
```bash
npm run electron:build:win:installer
```

**Note:** First-time Wine setup may prompt you to configure it. You can skip most prompts.

##### Option 2: Use Directory Build + Zip (No Wine Needed)

Build the unpacked directory and create a zip file:

```bash
# Build unpacked directory
npm run electron:build:win:dir

# Create a zip file (Windows PowerShell)
cd release
Compress-Archive -Path "win-unpacked\*" -DestinationPath "Firewall-Config-Viewer-Portable.zip"

# Or in WSL/Linux
cd release
zip -r Firewall-Config-Viewer-Portable.zip win-unpacked/*
```

**Share the zip file** - Users extract it and run `Firewall Config Viewer.exe` from the extracted folder.

##### Option 3: Build on Windows Natively

If you have access to Windows, build there:
```bash
npm run electron:build:win:installer
```

This avoids Wine entirely and is the fastest option.

##### Option 4: Use Portable Build (May Still Need Wine)

Try the portable build (single .exe, but may still require Wine):
```bash
npm run electron:build:win:portable
```

**Recommendation:** For WSL users, use **Option 2** (directory + zip) as it's the most reliable without Wine setup.

#### Installer Won't Run / Nothing Happens When Clicked

**Issue:** The installer `.exe` file was created, but when you double-click it, nothing happens or Windows blocks it.

**Why this happens:** Windows SmartScreen and security features often block unsigned executables. This is normal for unsigned applications.

**Solutions:**

1. **Right-click and "Run as Administrator":**
   - Right-click the installer `.exe` file
   - Select "Run as administrator"
   - Click "Yes" on the UAC prompt

2. **Unblock the file (if downloaded):**
   - Right-click the installer `.exe` file
   - Select "Properties"
   - If you see an "Unblock" checkbox at the bottom, check it
   - Click "OK"
   - Try running it again

3. **Bypass SmartScreen warning:**
   - When Windows shows "Windows protected your PC" warning
   - Click "More info"
   - Click "Run anyway"
   - The installer should start

4. **Check Windows Event Viewer for errors:**
   - Press `Win + X` and select "Event Viewer"
   - Go to "Windows Logs" → "Application"
   - Look for errors related to the installer
   - This can help identify specific issues

5. **Run from Command Prompt:**
   ```cmd
   cd "path\to\release"
   "Firewall Config Viewer-Setup-1.0.0.exe"
   ```
   This may show error messages that aren't visible when double-clicking.

6. **Verify the installer file:**
   - Check the file size (should be 100-200MB)
   - If the file is very small (< 10MB) or the installer runs but does nothing, it's likely corrupted
   - **If built from WSL with Wine, the installer is likely corrupted** - This is a known issue
   - **Solution:** Build on Windows natively OR use the directory build instead

7. **If installer runs but does nothing (especially from WSL build):**
   - The NSIS installer built from WSL/Wine is often corrupted or incomplete
   - **Best solution:** Build on Windows natively:
     ```bash
     npm run electron:build:win:installer
     ```
   - **Alternative:** Use directory build (works reliably from WSL):
     ```bash
     npm run electron:build:win:dir
     ```
     Then zip the `win-unpacked` folder and share that instead

**Note:** This is expected behavior for unsigned applications. For production distribution, consider code signing with a certificate, but for internal/testing use, the above workarounds are sufficient.

#### NSIS Cache Error (Access Denied / elevate.exe not found)

**Error:** `Access is denied` or `ENOENT: no such file or directory, copyfile ... elevate.exe`

**Why this happens:** The electron-builder cache for NSIS is locked, corrupted, or being accessed by another process.

**Solutions:**

1. **Clear the electron-builder cache:**
   ```powershell
   # Delete the NSIS cache folder
   Remove-Item -Recurse -Force "$env:LOCALAPPDATA\electron-builder\Cache\nsis" -ErrorAction SilentlyContinue
   ```
   Then try building again.

2. **Close other processes:**
   - Close any other instances of electron-builder or npm
   - Close any file managers that might have the cache folder open
   - Try building again

3. **Run PowerShell as Administrator:**
   - Right-click PowerShell → "Run as Administrator"
   - Navigate to your project folder
   - Run the build command again

4. **Disable elevation (already done in config):**
   - The config now has `"allowElevation": false` which avoids needing `elevate.exe`
   - This should prevent this error in future builds

5. **Manual cache cleanup:**
   ```powershell
   # Clear entire electron-builder cache
   Remove-Item -Recurse -Force "$env:LOCALAPPDATA\electron-builder\Cache" -ErrorAction SilentlyContinue
   ```

After clearing the cache, try building again:
```powershell
npm run electron:build:win:installer
```

#### Code Signing Errors

**Error:** `Cannot use 'in' operator to search for 'file' in undefined` or signing-related errors

**Why this happens:** Even with `sign: false`, electron-builder may still try to access signing configuration.

**Solution:** The configuration now uses `sign: null` and explicitly sets all signing-related fields to `null` or `false`. This should completely disable signing.

If you still get signing errors:

1. **Clear the build cache:**
   ```powershell
   Remove-Item -Recurse -Force "$env:LOCALAPPDATA\electron-builder\Cache" -ErrorAction SilentlyContinue
   ```

2. **Set environment variable (if needed):**
   ```powershell
   $env:CSC_IDENTITY_AUTO_DISCOVERY = "false"
   npm run electron:build:win:installer
   ```

3. **Verify the config:** Make sure `package.json` has `"sign": null` (not `false`) in the `win` section.

The build configuration disables code signing completely, so you shouldn't encounter signing errors.

### macOS Build Issues

#### Cannot Build macOS from Windows/WSL

**Error:** `Cannot find module 'dmg-license'` or similar errors when building on WSL/Windows

**Solution:** macOS builds **must be done on a macOS machine**. You cannot build macOS applications from Windows or WSL.

**Options:**
1. Use a Mac to build macOS versions
2. Use CI/CD services (GitHub Actions, etc.) with macOS runners
3. Build Windows version from WSL, macOS version from Mac

#### Code Signing Errors

If you get code signing errors on macOS:

1. The build config already disables hardened runtime and gatekeeper assessment
2. If you need to sign, you'll need an Apple Developer certificate
3. For distribution outside the App Store, you may need to notarize the app

### Build Fails with "Cannot find module"

Make sure you've run `npm install` and all dependencies are installed.

### Large Build Size

The build includes all necessary Electron runtime files. This is normal. The portable executable will be around 100-150MB.

## Distribution

### Windows

#### ⭐ Recommended: NSIS Installer
- **File to share:** `Firewall Config Viewer-Setup-1.0.0.exe` (single file)
- **User experience:** Double-click the `.exe` → Follow installer → Done!
- **Includes:** All dependencies, DLLs, and files bundled in one installer
- **Best for:** Most users, professional distribution

#### Alternative: Portable Executable
- **File to share:** `Firewall Config Viewer-1.0.0-portable.exe` (single file)
- **User experience:** Double-click the `.exe` → Runs immediately (no installation)
- **Best for:** Users who want a portable version without installation
- **Note:** May have DLL issues on some systems - installer is more reliable

### macOS
- **DMG**: Share the `.dmg` file - users can drag the app to Applications folder
- **ZIP**: Share the `.zip` file - users can extract and run the `.app` bundle

## Notes

- The portable Windows executable is self-contained and doesn't require installation
- The macOS builds create proper `.app` bundles that can be distributed
- All builds are unsigned by default (for easier distribution)
- For production distribution, consider code signing for better user trust

