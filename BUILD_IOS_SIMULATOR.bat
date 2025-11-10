@echo off
echo ============================================
echo Building iOS Simulator Version
echo ============================================
echo.
echo This build:
echo - Works WITHOUT Apple Developer Account
echo - Takes 10-15 minutes
echo - Can be installed on iOS Simulator
echo - Includes all your iPad UI fixes
echo.
echo ============================================
echo.

cd /d "%~dp0"
eas build --platform ios --profile development --non-interactive

echo.
echo ============================================
echo Build started! Check the Expo dashboard:
echo https://expo.dev/accounts/mazen123333/projects/guild-2/builds
echo ============================================
pause

