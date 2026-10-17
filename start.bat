@echo off
setlocal enabledelayedexpansion
title RIDEX V3 - Universal Development Runner (Android, iOS, Web)

echo =====================================================================
echo   ____  ___ ____  _______  __
echo  ^|  _ \^|_ _^|  _ \^| ____\ \/ /   RIDEX CONNECTED GROUP RIDING
echo  ^| ^|_) ^|^| ^| ^| ^| ^| ^|  _^|  \  /    MOTORCYCLE TOURING PLATFORM
echo  ^|  _ ^< ^| ^| ^| ^|_^| ^| ^|___  /  \    Cross-Platform Live Server
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

:: Handle command-line arguments if provided
if "%1"=="web" goto RUN_WEB
if "%1"=="apk" goto RUN_APK_BUILD
if "%1"=="eas" goto RUN_APK_BUILD
if "%1"=="android" goto RUN_ANDROID_NATIVE

:RUN_UNIVERSAL
echo  -------------------------------------------------------------
echo   TESTING INSTRUCTIONS:
echo  -------------------------------------------------------------
echo   [Android] Scan the QR code below in the Expo Go app or your APK
echo   [iPhone]  Scan the QR code below with your iPhone Camera app
echo   [Laptop]  Press 'w' in this window to open Web Cockpit
echo  -------------------------------------------------------------
echo   Keyboard Shortcuts:
echo   - Press 'w' : Open Web Cockpit in default browser
echo   - Press 'r' : Reload app on all connected devices
echo   - Press 'j' : Open JavaScript debugger
echo  -------------------------------------------------------------
echo.
echo [RIDEX] Starting Universal Metro Server on LAN with clean cache...
echo.

call npx expo start --lan -c
goto END

:RUN_WEB
echo [RIDEX] Starting Web Cockpit Server...
call npx expo start --web
goto END

:RUN_APK_BUILD
echo [RIDEX] Triggering Standalone Android APK Build...
call npx eas-cli build -p android --profile preview
goto END

:RUN_ANDROID_NATIVE
echo [RIDEX] Launching Native Android Build...
call npx expo run:android
goto END

:END
pause
