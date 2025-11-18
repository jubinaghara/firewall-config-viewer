# Packaging Instructions for Firewall Config Viewer

This guide explains how to package the Firewall Config Viewer as a desktop application for Windows and macOS.

## Prerequisites

- Node.js (v18 or higher) installed on your system
- npm or yarn package manager

## Installation

1. Install dependencies:
```bash
npm install
```

## Development

To run the app in development mode:

```bash
npm run electron:dev
```

This will start the Vite dev server and launch Electron.

## Building Executables

### Build for Current Platform

To build for your current platform (Windows or Mac):

```bash
npm run electron:build
```

### Build for Windows Only

**On Windows (Native):**
```bash
npm run electron:build:win
```

**From WSL/Linux (No Code Signing):**
```bash
npm run electron:build:win:nosign
```

This creates:
- Windows installer (`.exe`) in the `release` folder
- 64-bit (x64) architecture only
- Unsigned (no code signing certificate required)

**Note:** Building from WSL requires Wine for signed builds. See `WSL_BUILD.md` for details.

### Build for macOS Only

```bash
npm run electron:build:mac
```

This creates:
- macOS DMG file in the `release` folder
- Supports both Intel (x64) and Apple Silicon (arm64) architectures

### Build for All Platforms

If you're on a Mac, you can build for both platforms:

```bash
npm run electron:build:all
```

**Note**: Building for Windows on macOS requires Wine to be installed. It's recommended to build Windows executables on a Windows machine.

## Output Files

After building, you'll find the packaged applications in the `release/` directory:

### Windows
- `Firewall Config Viewer Setup x.x.x.exe` - Windows installer
- Installer allows users to:
  - Choose installation directory
  - Create desktop shortcut
  - Create start menu shortcut

### macOS
- `Firewall Config Viewer-x.x.x.dmg` - macOS disk image
- Users can drag and drop to Applications folder

## Distribution

### Windows
Distribute the `.exe` installer file. Users simply run it to install.

### macOS
Distribute the `.dmg` file. Users:
1. Open the DMG
2. Drag the app to Applications folder
3. May need to allow in System Preferences > Security (first run only)

## Alternative: Static Web App

If you prefer to distribute as a web app instead of an executable:

### Build Static Files
```bash
npm run build
```

This creates static files in the `dist/` folder that can be:
1. **Hosted on a web server** - Upload the `dist/` folder contents to any web server
2. **Served locally** - Use a simple HTTP server:
   ```bash
   npm install -g http-server
   cd dist
   http-server
   ```
3. **Opened directly** - Double-click `index.html` (note: file:// protocol has limitations)

### Simple Local Server (Recommended)

The easiest way for users to run the static build locally:

1. After building, create a simple batch/shell script:

**Windows (`run.bat`):**
```bat
@echo off
cd dist
python -m http.server 8000
```

**Mac/Linux (`run.sh`):**
```bash
#!/bin/bash
cd dist
python3 -m http.server 8000
```

2. Users double-click the script
3. Open browser to `http://localhost:8000`

## Icon Files (Optional)

To customize the app icon:

1. Create icon files:
   - `assets/icon.ico` (Windows, 256x256)
   - `assets/icon.icns` (macOS, 512x512)
   - `assets/icon.png` (Source, 512x512)

2. You can use tools like:
   - [IconKitchen](https://icon.kitchen/) - Online icon generator
   - [CloudConvert](https://cloudconvert.com/) - Convert PNG to ICO/ICNS

## Troubleshooting

### Build Fails
- Ensure all dependencies are installed: `npm install`
- Check Node.js version: `node --version` (should be 18+)
- Clear cache: `rm -rf node_modules package-lock.json && npm install`

### Electron App Won't Start
- Make sure you ran `npm run build` first
- Check that `dist/index.html` exists
- Verify `electron/main.js` is correct

### Windows Build on Mac
- Install Wine: `brew install --cask wine-stable`
- Note: This may not work perfectly. Best to build Windows apps on Windows.

## File Sizes

Expected output sizes:
- Windows installer: ~80-120 MB
- macOS DMG: ~80-120 MB

These sizes include Electron runtime and all dependencies.

## Summary

**Simplest for End Users (Recommended):**
- Use Electron build → Creates `.exe` (Windows) or `.dmg` (Mac)
- Users just install and run like any other desktop app

**Alternative:**
- Build static files → Host on web server or use local HTTP server
- No installation needed, works in any browser

