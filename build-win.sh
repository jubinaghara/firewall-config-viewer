#!/bin/bash
# Helper script to build Windows executable from WSL/Linux
# This ensures all signing is disabled

export CSC_IDENTITY_AUTO_DISCOVERY=false

# Build the app
npm run build

# Build Windows executable with all signing disabled
electron-builder --win portable --x64 \
  --config.win.sign=false \
  --config.forceCodeSigning=false

echo "Build complete! Check the release/ directory."

