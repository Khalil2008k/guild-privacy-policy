@echo off
echo Stopping any running Expo processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo Starting Expo with Tunnel mode (more stable for icon loading)...
echo.
cd /d "%~dp0"
npx expo start --tunnel --clear

pause

