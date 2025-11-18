#!/bin/bash

echo "Starting Firewall Config Viewer..."
echo ""
echo "Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "Build failed! Make sure you ran 'npm install' first."
    exit 1
fi

echo ""
echo "Starting local server..."
echo "Open your browser to: http://localhost:8000"
echo "Press Ctrl+C to stop the server"
echo ""

cd dist
python3 -m http.server 8000 2>/dev/null || python -m http.server 8000

