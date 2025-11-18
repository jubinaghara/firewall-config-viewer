# Distribution Guide - Firewall Config Viewer

## How to Share the Application

### Option 1: NSIS Installer (Recommended) ⭐

**Best for:** Most users, professional distribution

The NSIS installer creates a single `.exe` file that users can run to install the application. This is the most reliable and user-friendly option.

**Build Command:**
```bash
npm run electron:build:win:installer
```

**Output:**
- `release/Firewall Config Viewer-Setup-1.0.0.exe` (single installer file)

**How to Share:**
1. Share the single `.exe` file from the `release/` folder
2. Users double-click it to install
3. The installer handles everything automatically

**Advantages:**
- ✅ Single file to share
- ✅ Professional installer experience
- ✅ Creates Start Menu shortcuts
- ✅ Creates Desktop shortcut (optional)
- ✅ Includes all DLLs and dependencies
- ✅ Most reliable distribution method

---

### Option 2: Portable Folder (Zipped)

**Best for:** Users who want a portable version without installation

**Build Command:**
```bash
npm run electron:build:win:dir
```

**Output:**
- `release/win-unpacked/` folder containing all files

**How to Share:**
1. **Zip the entire `win-unpacked` folder:**
   ```bash
   # On Windows
   Compress-Archive -Path "release\win-unpacked\*" -DestinationPath "Firewall-Config-Viewer-Portable.zip"
   
   # On Linux/WSL
   cd release
   zip -r Firewall-Config-Viewer-Portable.zip win-unpacked/*
   ```

2. Share the `.zip` file
3. Users extract the zip and run `Firewall Config Viewer.exe` from the extracted folder

**Important:** Users must extract the entire folder - they cannot just copy the `.exe` file alone!

**Advantages:**
- ✅ No installation required
- ✅ Portable (can run from USB drive)
- ✅ All files included

**Disadvantages:**
- ❌ Must share entire folder (not just .exe)
- ❌ Users need to extract zip file
- ❌ More files to manage

---

### Option 3: Portable Executable (If Working)

**Build Command:**
```bash
npm run electron:build:win:portable
```

**Expected Output:**
- `release/Firewall Config Viewer-1.0.0-portable.exe` (single self-contained file)

**Note:** The portable format should create a single `.exe` that includes all DLLs, but if you're still getting the `ffmpeg.dll` error, use Option 1 or 2 instead.

---

## Current Issue: ffmpeg.dll Error

If you're getting the `ffmpeg.dll was not found` error, it means:

1. **You're sharing only the `.exe` file** - The portable `.exe` needs all DLL files in the same directory
2. **The portable build isn't truly self-contained** - This can happen with electron-builder's portable format

## Solution: Use the NSIS Installer

**The NSIS installer is the most reliable solution:**

```bash
npm run electron:build:win:installer
```

This creates a single installer `.exe` file that:
- Includes all necessary DLLs (including ffmpeg.dll)
- Works on any Windows machine
- Provides a professional installation experience
- Creates shortcuts automatically

**Share this single file:** `release/Firewall Config Viewer-Setup-1.0.0.exe`

Users just need to:
1. Download the `.exe` file
2. Double-click to run the installer
3. Follow the installation wizard
4. Launch from Start Menu or Desktop shortcut

---

## Quick Reference

| Method | File to Share | User Experience | Reliability |
|--------|---------------|-----------------|-------------|
| **NSIS Installer** ⭐ | Single `.exe` | Install wizard | ✅ Best |
| **Portable Folder** | Zipped folder | Extract & run | ✅ Good |
| **Portable .exe** | Single `.exe` | Just run | ⚠️ May have DLL issues |

## Recommendation

**Use the NSIS Installer** - It's the most reliable and user-friendly option. One file, professional experience, no DLL issues.

