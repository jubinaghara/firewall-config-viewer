@echo off
echo Starting Firewall Config Viewer...
echo.
echo Building application...
call npm run build

if %errorlevel% neq 0 (
    echo Build failed! Make sure you ran 'npm install' first.
    pause
    exit /b 1
)

echo.
echo Starting local server...
echo Open your browser to: http://localhost:8000
echo Press Ctrl+C to stop the server
echo.

cd dist
python -m http.server 8000 2>nul
if %errorlevel% neq 0 (
    echo Python not found. Trying alternative method...
    node -e "require('http').createServer((req,res)=>{require('fs').createReadStream('.'+require('url').parse(req.url).pathname.replace(/\/$/, '/index.html'))).pipe(res)}).listen(8000);console.log('Server at http://localhost:8000')"
)

