# Simple Build Instructions

## ⚠️ Building Windows Apps from WSL is Problematic

Electron-builder requires Windows tools to create installers, which need Wine in WSL. **The easiest solution is to build from native Windows.**

## ✅ Recommended: Build from Native Windows

1. **Open Windows Command Prompt or PowerShell** (NOT WSL)
   - Press `Win + R`, type `cmd`, press Enter
   - Or press `Win + X` and select "Windows PowerShell"

2. **Navigate to your project:**
   ```cmd
   cd "C:\Users\jubin.aghara\OneDrive - Sophos Ltd\Work\AUTOMATION PYTHON\Examples\Humanreadable config\firewall-config-viewer"
   ```

3. **Build:**
   ```cmd
   npm install
   npm run electron:build:win
   ```

4. **Find your installer:**
   - Location: `release\Firewall Config Viewer Setup x.x.x.exe`
   - This is a proper Windows installer ready for distribution

## 🔄 Alternative: Use Unpacked Directory (WSL)

If you MUST build from WSL, create an unpacked directory:

```bash
npm run electron:build:win:dir
```

This creates `release/win-unpacked/` with all files. Then:
1. Zip the `win-unpacked` folder
2. Users extract and run `Firewall Config Viewer.exe`

**Note:** This still requires Wine for some operations.

## 🌐 Easiest Alternative: Static Web App

Skip Electron entirely and distribute as a web app:

1. **Build static files:**
   ```bash
   npm run build
   ```

2. **Run the simple server script:**
   - Windows: Double-click `run-local.bat`
   - Mac/Linux: Run `./run-local.sh`

3. **Or host on any web server:**
   - Upload `dist/` folder to any web hosting
   - Works in any modern browser
   - No installation needed

## 📊 Comparison

| Method | Platform | Difficulty | Output |
|--------|----------|------------|--------|
| Native Windows Build | Windows CMD | ⭐ Easy | `.exe` installer |
| Static Web App | Any | ⭐⭐ Easy | Browser-based |
| WSL Build | WSL | ⭐⭐⭐ Hard | Requires Wine |

**Recommendation:** Use native Windows build for best results!

