# Local Fonts Setup

This directory contains locally bundled fonts to ensure the application works completely offline.

## Required Font Files

To make the application fully offline, you need to download the following font files:

### 1. Inter Font Family
Download from: https://fonts.google.com/specimen/Inter
- Inter-Light.woff2
- Inter-Regular.woff2
- Inter-Medium.woff2
- Inter-SemiBold.woff2
- Inter-Bold.woff2

Or use: https://gwfh.mranftl.com/fonts/inter

### 2. Material Symbols Outlined
Download from: https://fonts.google.com/icons
- MaterialSymbolsOutlined[FILL,GRAD,opsz,wght].woff2

Or use: https://github.com/google/material-design-icons/tree/master/variablefont

## Quick Setup Script

You can use the following PowerShell script to download fonts:

```powershell
# Download Inter font
$interUrl = "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
# Then extract font URLs from the CSS and download the .woff2 files

# Download Material Symbols
$materialUrl = "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0"
# Extract and download the .woff2 file
```

## Alternative: Use Font Download Tools

1. Use https://gwfh.mranftl.com/ to download Inter font
2. Use Google Fonts Helper or similar tools to download Material Symbols

## File Structure

After downloading, your fonts directory should contain:
```
fonts/
  ├── Inter-Light.woff2
  ├── Inter-Regular.woff2
  ├── Inter-Medium.woff2
  ├── Inter-SemiBold.woff2
  ├── Inter-Bold.woff2
  └── MaterialSymbolsOutlined.woff2
```

