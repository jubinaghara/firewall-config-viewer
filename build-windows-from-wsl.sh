#!/bin/bash

echo "=========================================="
echo "Building Windows App from WSL"
echo "=========================================="
echo ""
echo "This script creates an unpacked Windows app directory"
echo "that can be zipped and distributed."
echo ""

# Build the web app
echo "Step 1: Building web application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

# Build Electron unpacked directory (no installer, no Wine needed)
echo ""
echo "Step 2: Packaging Electron app (unpacked directory)..."
CSC_IDENTITY_AUTO_DISCOVERY=false electron-builder --win --dir

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Electron build failed!"
    echo ""
    echo "💡 SOLUTION: Build from native Windows instead:"
    echo "   1. Open Windows Command Prompt or PowerShell"
    echo "   2. Navigate to this directory"
    echo "   3. Run: npm run electron:build:win"
    echo ""
    exit 1
fi

echo ""
echo "✅ Build complete!"
echo ""
echo "📦 Output location: release/win-unpacked/"
echo ""
echo "To distribute:"
echo "  1. Zip the 'win-unpacked' folder"
echo "  2. Rename it to 'Firewall-Config-Viewer-Windows.zip'"
echo "  3. Users can extract and run 'Firewall Config Viewer.exe'"
echo ""

