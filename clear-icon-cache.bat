@echo off
echo Clearing Windows Icon Cache...
echo.

REM Stop Windows Explorer
taskkill /f /im explorer.exe

REM Clear icon cache
del /a /q /f "%LOCALAPPDATA%\IconCache.db" 2>nul
del /a /q /f "%LOCALAPPDATA%\Microsoft\Windows\Explorer\iconcache*.db" 2>nul
del /a /q /f "%LOCALAPPDATA%\Microsoft\Windows\Explorer\thumbcache_*.db" 2>nul

REM Clear icon cache in system locations (requires admin)
if exist "%SystemRoot%\System32\iconcache.db" (
    echo Note: System icon cache requires administrator privileges
    echo Run this script as administrator to clear system cache
)

REM Restart Windows Explorer
start explorer.exe

echo.
echo Icon cache cleared! Please restart your computer for changes to take full effect.
echo.
pause






