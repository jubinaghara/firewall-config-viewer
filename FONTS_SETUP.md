# Local Fonts Setup Guide

To make the application completely offline (no internet connectivity required), you need to download and bundle the fonts locally.

## Quick Setup

### Option 1: Use Google Fonts Helper (Recommended)

1. Visit https://gwfh.mranftl.com/
2. Search for "Inter" and download all weights (300, 400, 500, 600, 700)
3. Search for "Material Symbols Outlined" and download
4. Extract the `.woff2` files to `public/fonts/` directory

### Option 2: Manual Download

1. **Inter Font:**
   - Visit: https://fonts.google.com/specimen/Inter or https://gwfh.mranftl.com/fonts/inter
   - **Select ONLY these weights (NOT italic versions):**
     - ✓ 300 (Light)
     - ✓ regular (400)
     - ✓ 500 (Medium)
     - ✓ 600 (SemiBold)
     - ✓ 700 (Bold)
   - **Do NOT select:** 100, 200, 800, 900, or any italic versions
   - Download and extract `.woff2` files
   - Rename and copy to `public/fonts/`:
     - `300.woff2` → `Inter-Light.woff2`
     - `regular.woff2` → `Inter-Regular.woff2`
     - `500.woff2` → `Inter-Medium.woff2`
     - `600.woff2` → `Inter-SemiBold.woff2`
     - `700.woff2` → `Inter-Bold.woff2`

2. **Material Symbols Outlined:**
   - Visit: https://fonts.google.com/icons
   - Download the variable font
   - Save as `MaterialSymbolsOutlined.woff2` in `public/fonts/`

### Option 3: Use PowerShell Script

Run the provided script (after updating URLs if needed):
```powershell
.\download-fonts.ps1
```

## File Structure

After setup, your `public/fonts/` directory should contain:
```
public/fonts/
  ├── Inter-Light.woff2
  ├── Inter-Regular.woff2
  ├── Inter-Medium.woff2
  ├── Inter-SemiBold.woff2
  ├── Inter-Bold.woff2
  └── MaterialSymbolsOutlined.woff2
```

## Fallback Behavior

If font files are not found, the application will:
- Use system fonts as fallback (Inter → system sans-serif)
- Material Symbols icons may not display (but won't break the app)

## Verification

After downloading fonts, rebuild the application:
```bash
npm run build
```

The application will now work completely offline without any external URL dependencies.

