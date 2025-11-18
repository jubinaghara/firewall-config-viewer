# Branding Guide - Customizing Product Name, Icons, and Branding

This guide shows you exactly where to change the product name, application icon, and all branding elements in your application.

## Quick Reference

| Element | Location | File |
|---------|----------|------|
| **Product Name** | Build config | `package.json` (line 46) |
| **App ID** | Build config | `package.json` (line 45) |
| **Version** | Package info | `package.json` (line 4) |
| **Author** | Package info | `package.json` (line 6) |
| **Description** | Package info | `package.json` (line 5) |
| **Desktop Icon (Windows)** | Build config | `package.json` (line 84) ⭐ |
| **Windows Icon** | Build config | `package.json` (line 84) |
| **macOS Icon** | Build config | `package.json` (line 108) |
| **Linux Icon** | Build config | `package.json` (line 121) |
| **Installer Icons** | Build config | `package.json` (lines 129-131) |
| **HTML Title** | HTML file | `index.html` (line 11) |
| **HTML Meta Description** | HTML file | `index.html` (line 9) |
| **HTML Favicon** | HTML file | `index.html` (line 5) |
| **App Header Title** | React component | `src/App.jsx` (line 232) |
| **App Hero Title** | React component | `src/App.jsx` (line 280) |
| **Hero Subtitle** | React component | `src/App.jsx` (line 285) ⭐ |
| **Logo Image** | React component | `src/App.jsx` (line 14) |
| **Electron Window Icon** | Electron main | `electron/main.js` (line 21) |

---

## Step-by-Step Instructions

### 1. Change Product Name

The product name appears in:
- Installer filename
- Start Menu shortcut name
- Application window title
- Build output files

**File:** `package.json`

```json
{
  "build": {
    "productName": "Your New App Name",  // ← Change this (line 46)
    "appId": "com.yourcompany.yourapp"   // ← Also update this (line 45)
  }
}
```

**Example:**
```json
"productName": "My Firewall Analyzer",
"appId": "com.mycompany.firewallanalyzer"
```

---

### 2. Change Desktop Icon (Windows) ⭐

**The desktop icon is the same as the Windows application icon.** When users install your app, the desktop shortcut will use this icon.

#### Quick Steps:

1. **Prepare your icon file:**
   - Format: `.ico` file (multi-resolution)
   - Recommended sizes: 16x16, 32x32, 48x48, 256x256 (all in one .ico file)
   - Create or download your icon file

2. **Place the icon file:**
   - Save it as `public/your-icon.ico` (replace `your-icon` with your filename)

3. **Update `package.json` (line 84):**
   ```json
   {
     "build": {
       "win": {
         "icon": "public/your-icon.ico"  // ← Change this
       }
     }
   }
   ```

4. **Rebuild the installer:**
   ```bash
   npm run electron:build:win:installer
   ```

5. **Clear Windows icon cache (if icon doesn't update):**
   - Delete the desktop shortcut
   - Press `Win + R`, type `ie4uinit.exe -show` and press Enter
   - Or restart Windows Explorer:
     - Press `Ctrl + Shift + Esc` to open Task Manager
     - Find "Windows Explorer" → Right-click → Restart
   - Reinstall the application

6. **Test:** Install the new `.exe` and check the desktop shortcut icon.

**Note:** The desktop icon is controlled by the `win.icon` setting. The installer will automatically use this icon for the desktop shortcut.

**Troubleshooting Desktop Icon Issues:**

If the desktop shortcut shows a different icon (like an atom symbol or default Electron icon):

1. **Verify the icon file:**
   - Make sure `public/sophos-favicon.ico` exists
   - Ensure it's a proper multi-resolution ICO file (not just a renamed PNG)
   - Test by opening it in Windows - it should show the correct icon

2. **Clear build cache:**
   ```bash
   # Delete release folder
   rm -rf release
   # Or on Windows PowerShell:
   Remove-Item -Recurse -Force release
   
   # Rebuild
   npm run electron:build:win:installer
   ```

3. **Verify icon is embedded:**
   - After building, check `release/win-unpacked/Firewall Config Viewer.exe`
   - Right-click → Properties → Change Icon
   - You should see your icon in the list

4. **Clear Windows icon cache:**
   - Delete the desktop shortcut
   - Run: `ie4uinit.exe -show` (refreshes icon cache)
   - Or restart Windows Explorer
   - Reinstall the application

5. **Check icon format:**
   - The icon must be a true `.ico` file with multiple resolutions
   - Use [ICO Convert](https://icoconvert.com/) to create a proper multi-resolution ICO
   - Include sizes: 16x16, 32x32, 48x48, 256x256

---

### 3. Change Application Icons (All Platforms)

You need to replace the icon files and update the paths in the configuration.

#### Step 1: Prepare Your Icon Files

**For Windows:**
- Format: `.ico` file
- Recommended sizes: 16x16, 32x32, 48x48, 256x256 (multi-resolution .ico)
- Location: `public/your-icon.ico`

**For macOS:**
- Format: `.icns` file (or `.ico` as fallback)
- Recommended sizes: 16x16, 32x32, 128x128, 256x256, 512x512, 1024x1024
- Location: `public/your-icon.icns` (or `.ico`)

**For Linux:**
- Format: `.png` file
- Recommended sizes: 512x512 or 1024x1024
- Location: `public/your-icon.png`

**Tip:** You can use online converters or tools like:
- [CloudConvert](https://cloudconvert.com/) - Convert PNG to ICO/ICNS
- [ICO Convert](https://icoconvert.com/) - Create multi-resolution ICO files
- macOS: Use `iconutil` command to create `.icns` from PNG

#### Step 2: Update Icon Paths in package.json

**File:** `package.json`

```json
{
  "build": {
    "win": {
      "icon": "public/your-icon.ico"  // ← Change this (line 79)
    },
    "mac": {
      "icon": "public/your-icon.icns"  // ← Change this (line 101)
    },
    "linux": {
      "icon": "public/your-icon.png"  // ← Change this (line 114)
    },
    "nsis": {
      "installerIcon": "public/your-icon.ico",      // ← Change this (line 123)
      "uninstallerIcon": "public/your-icon.ico",    // ← Change this (line 124)
      "installerHeaderIcon": "public/your-icon.ico" // ← Change this (line 125)
    },
    "dmg": {
      "icon": "public/your-icon.icns"  // ← Change this (line 137)
    }
  }
}
```

#### Step 3: Update HTML Favicon

**File:** `index.html`

```html
<link rel="icon" type="image/x-icon" href="/your-icon.ico" />
<link rel="apple-touch-icon" href="/your-icon.ico" />
```

#### Step 4: Update Electron Window Icon

**File:** `electron/main.js`

```javascript
icon: join(__dirname, '../public/your-icon.ico'),  // ← Change this (line 21)
```

---

### 4. Change Application Title (HTML)

**File:** `index.html`

```html
<title>Your New App Title</title>  <!-- Line 11 -->
<meta name="description" content="Your app description here" />  <!-- Line 9 -->
```

---

### 5. Change App Name in UI (React Components)

**File:** `src/App.jsx`

#### Header Title (Line 232):
```jsx
<h1 className="text-xl font-semibold">
  Your New App Name  {/* ← Change this */}
</h1>
```

#### Hero Title (Line 280):
```jsx
<h1 className="text-5xl font-bold mb-4">
  Your New App Title  {/* ← Change this */}
</h1>
```

#### Hero Subtitle (Line 285):
```jsx
<p className="text-xl mb-2 max-w-3xl mx-auto">
  Analyze and compare your firewall configurations with powerful, privacy-first tools  {/* ← Change this */}
</p>
```

#### Logo Image (Line 14):
```jsx
const sophosLogoUrl = '/your-logo.svg'  // ← Change this
```

Then update the image reference (Line 216):
```jsx
<img 
  src={sophosLogoUrl} 
  alt="Your Company"  // ← Change this
  className="h-7 w-auto"
/>
```

---

### 6. Change App ID (Bundle Identifier)

**File:** `package.json`

```json
{
  "build": {
    "appId": "com.yourcompany.yourapp"  // ← Change this (line 45)
  }
}
```

**Format:** Reverse domain notation (e.g., `com.company.appname`)

---

### 7. Change Version Number

**File:** `package.json`

```json
{
  "version": "1.0.0"  // ← Change this (line 4)
}
```

**Format:** Semantic versioning (e.g., `1.2.3`)

---

### 8. Change Author and Description

**File:** `package.json`

```json
{
  "author": "Your Name or Company",  // ← Change this (line 6)
  "description": "Your app description"  // ← Change this (line 5)
}
```

---

## Complete Example: Renaming Everything

Let's say you want to rename the app to "Network Security Analyzer":

### 1. Update `package.json`:

```json
{
  "name": "network-security-analyzer",
  "version": "1.0.0",
  "description": "A powerful tool to analyze network security configurations",
  "author": "Your Company",
  "build": {
    "appId": "com.yourcompany.networksecurityanalyzer",
    "productName": "Network Security Analyzer",
    "win": {
      "icon": "public/network-icon.ico"
    },
    "mac": {
      "icon": "public/network-icon.icns"
    },
    "nsis": {
      "installerIcon": "public/network-icon.ico",
      "uninstallerIcon": "public/network-icon.ico",
      "installerHeaderIcon": "public/network-icon.ico"
    }
  }
}
```

### 2. Update `index.html`:

```html
<title>Network Security Analyzer</title>
<meta name="description" content="Network Security Analyzer - Analyze and visualize security configurations" />
<link rel="icon" type="image/x-icon" href="/network-icon.ico" />
```

### 3. Update `electron/main.js`:

```javascript
icon: join(__dirname, '../public/network-icon.ico'),
```

### 4. Update `src/App.jsx`:

```jsx
const logoUrl = '/network-logo.svg'

// Line 232:
<h1 className="text-xl font-semibold">
  Network Security Analyzer
</h1>

// Line 280:
<h1 className="text-5xl font-bold mb-4">
  Network Security Analyzer
</h1>
```

---

## Icon File Requirements

### Windows (.ico)
- **Format:** Multi-resolution ICO file
- **Sizes:** 16x16, 32x32, 48x48, 256x256 (all in one file)
- **Tools:** 
  - Online: [ICO Convert](https://icoconvert.com/)
  - Windows: Use GIMP or ImageMagick
  - Command line: `magick convert icon.png -define icon:auto-resize=16,32,48,256 icon.ico`

### macOS (.icns)
- **Format:** ICNS file (Apple icon format)
- **Sizes:** 16x16, 32x32, 128x128, 256x256, 512x512, 1024x1024
- **Tools:**
  - macOS: `iconutil -c icns icon.iconset`
  - Online: [CloudConvert](https://cloudconvert.com/png-to-icns)

### Linux (.png)
- **Format:** PNG file
- **Size:** 512x512 or 1024x1024 (square)
- **Tools:** Any image editor

---

## Testing Your Changes

After making changes:

1. **Rebuild the application:**
   ```bash
   npm run build
   npm run electron:build:win:installer
   ```

2. **Check the output:**
   - Installer filename should reflect new product name
   - Installer should show your new icon
   - Application window should show new title
   - Start Menu shortcut should have new name

3. **Test the installer:**
   - Run the installer
   - Verify icon appears correctly
   - Check Start Menu shortcut name
   - Verify application title in window

---

## Troubleshooting

### Icon Not Showing
- **Issue:** Icon doesn't appear in installer or application
- **Solution:** 
  - Ensure icon file exists in `public/` folder
  - Check file path is correct (case-sensitive on Linux/Mac)
  - Verify icon format is correct (.ico for Windows, .icns for Mac)
  - Rebuild after changing icon paths

### Product Name Not Updating
- **Issue:** Old name still appears in some places
- **Solution:**
  - Clear `release/` folder: `rm -rf release`
  - Clear build cache: `rm -rf node_modules/.cache`
  - Rebuild: `npm run electron:build:win:installer`

### HTML Title Not Updating
- **Issue:** Browser tab still shows old title
- **Solution:**
  - Clear browser cache
  - Rebuild: `npm run build`
  - Restart dev server if in development

---

## Summary Checklist

- [ ] Update `productName` in `package.json`
- [ ] Update `appId` in `package.json`
- [ ] Replace icon files in `public/` folder
- [ ] Update all icon paths in `package.json`
- [ ] Update favicon in `index.html`
- [ ] Update title in `index.html`
- [ ] Update icon path in `electron/main.js`
- [ ] Update app name in `src/App.jsx` (header and hero)
- [ ] Update logo image path in `src/App.jsx`
- [ ] Rebuild the application
- [ ] Test the installer and application

---

## Quick Command Reference

```bash
# Build installer with new branding
npm run electron:build:win:installer

# Build portable version
npm run electron:build:win:portable

# Clean and rebuild
rm -rf release node_modules/.cache
npm run electron:build:win:installer
```

