@echo off
setlocal enabledelayedexpansion
title RIDEX V3 - Standalone Android APK Builder (EAS Cloud)

echo =====================================================================
echo   ____  ___ ____  _______  __
echo  ^|  _ \^|_ _^|  _ \^| ____\ \/ /   RIDEX MOTORCYCLE PLATFORM
echo  ^| ^|_) ^|^| ^| ^| ^| ^| ^|  _^|  \  /    Standalone Android APK Builder
echo  ^|  _ ^< ^| ^| ^| ^|_^| ^| ^|___  /  \    EAS Cloud Native Build
echo  ^|_^| \_\___^|____/^|_____/_/\_\
echo =====================================================================
echo.

cd /d "%~dp0ridex-mobile"
if not exist "package.json" (
    echo [ERROR] Could not find ridex-mobile directory!
    echo Please make sure this script is in the RIDEX root folder.
    pause
    exit /b 1
)

echo [INFO] Building standalone installable APK with full Native Hardware Voice Intercom,
echo        continuous background GPS tracking, Bluetooth audio focus, and offline maps.
echo.
echo [INFO] EAS Cloud will compile the APK and provide a direct download link and QR code.
echo =====================================================================
echo.

call npx eas-cli build -p android --profile preview

echo.
echo =====================================================================
echo [INFO] Build process finished. Scan the QR code or open the link above
echo        on your Android phone to install the RIDEX APK!
echo =====================================================================
pause
