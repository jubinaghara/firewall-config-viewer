# Quick Start - Packaging Guide

## 🚀 Fastest Way to Create Executables

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Build for Your Platform

**Windows (Native Windows - Recommended):**
Open Command Prompt/PowerShell (not WSL) and run:
```cmd
npm run electron:build:win
```

**Windows (From WSL - Use Portable):**
```bash
npm run electron:build:win:portable
```
*This creates a portable .exe that runs without installation*

**macOS:**
```bash
npm run electron:build:mac
```

**Current Platform (Auto-detect):**
```bash
npm run electron:build
```

### Step 3: Find Your Executable

After building, check the `release/` folder:
- **Windows**: `Firewall Config Viewer Setup x.x.x.exe`
- **macOS**: `Firewall Config Viewer-x.x.x.dmg`

## 📦 Distribution

### Windows Users
- Give them the `.exe` file
- They run it and install like any Windows program

### Mac Users
- Give them the `.dmg` file
- They open it and drag to Applications folder

## 🛠️ Development Mode

To test the Electron app during development:
```bash
npm run electron:dev
```

## ⚠️ Important Notes

1. **Icons**: The app will work without custom icons, but you can add:
   - `assets/icon.ico` for Windows
   - `assets/icon.icns` for macOS

2. **File Size**: Executables will be ~80-120 MB (includes Electron runtime)

3. **Cross-Platform Building**: 
   - Building Windows on Mac requires Wine (not recommended)
   - Best to build Windows apps on Windows, Mac apps on Mac

## 📄 For More Details

See `PACKAGING.md` for detailed instructions and alternatives.

