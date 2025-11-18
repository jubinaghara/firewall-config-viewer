# Building Windows Executable from WSL - Solutions

You're getting a Wine error because electron-builder needs Windows tools to create installers. Here are your options:

## ⚠️ Problem

Building Windows executables from WSL requires Wine to run Windows-specific tools. Even with code signing disabled, the NSIS installer creation needs Windows binaries.

## ✅ Solution 1: Build from Native Windows (RECOMMENDED)

**This is the easiest and most reliable solution:**

1. Open **Windows Command Prompt** or **PowerShell** (NOT WSL)
2. Navigate to your project:
   ```cmd
   cd "C:\Users\jubin.aghara\OneDrive - Sophos Ltd\Work\AUTOMATION PYTHON\Examples\Humanreadable config\firewall-config-viewer"
   ```
3. Install dependencies (if not done):
   ```cmd
   npm install
   ```
4. Build:
   ```cmd
   npm run electron:build:win
   ```

This will work perfectly without any Wine setup!

## ✅ Solution 2: Use Portable Format (WSL-Friendly)

Portable executables don't need an installer, so they work better from WSL:

```bash
npm run electron:build:win:portable
```

This creates a `.exe` file that runs directly (no installer needed). Users just double-click to run.

**Output:** `release/Firewall Config Viewer x.x.x.exe` (portable)

## ✅ Solution 3: Install Wine (Advanced)

If you must build NSIS installers from WSL:

```bash
sudo apt update
sudo apt install wine64
```

Then try:
```bash
npm run electron:build:win
```

**Note:** Wine installation can be complex and may not work perfectly.

## 📦 Output Differences

### NSIS Installer (Standard)
- Creates `.exe` installer
- Users can install to Program Files
- Creates desktop shortcuts
- Requires Wine from WSL

### Portable Executable
- Creates standalone `.exe` 
- No installation needed - just run it
- Easier to distribute
- Works from WSL without Wine

## 🎯 Quick Recommendation

**For distribution:** Use Solution 1 (native Windows) to create proper installers
**For quick testing from WSL:** Use Solution 2 (portable format)

