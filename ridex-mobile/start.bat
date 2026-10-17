@echo off
setlocal enabledelayedexpansion
title RIDEX V3 - Native Development and Live Ride Runner

echo =====================================================================
echo   ____  ___ ____  _______  __
echo  ^|  _ \^|_ _^|  _ \^| ____\ \/ /   RIDEX CONNECTED GROUP RIDING
echo  ^| ^|_) ^|^| ^| ^| ^| ^| ^|  _^|  \  /    MOTORCYCLE TOURING PLATFORM
echo  ^|  _ ^< ^| ^| ^| ^|_^| ^| ^|___  /  \    Native Development Runner
echo  ^|_^| \_\___^|____/^|_____/_/\_\
echo =====================================================================
echo.

cd /d "%~dp0"

:: Automatically ensure correct Java 17 and Android SDK environment
if exist "C:\Program Files\Java\jdk-17" set "JAVA_HOME=C:\Program Files\Java\jdk-17"
if exist "%LOCALAPPDATA%\Android\Sdk" set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"

:: Check if command-line argument is passed (e.g. start.bat android)
if "%1"=="android" goto RUN_ANDROID
if "%1"=="dev-client" goto RUN_DEV_CLIENT
if "%1"=="web" goto RUN_WEB
if "%1"=="build-apk" goto RUN_BUILD_APK
if "%1"=="eas" goto RUN_EAS

:MENU
echo  Select Run Mode:
echo  -------------------------------------------------------------
echo  [1] Expo Server with Clear Cache (Cross-Platform iOS/Android)
echo      Command: npx expo start --clear
echo.
echo  [2] Native Android Development Build (Hardware Voice Intercom)
echo      Command: npx expo run:android
echo.
echo  [3] Build Standalone Android Release APK (Direct Phone Sideload)
echo      Command: cd android && gradlew.bat assembleRelease
echo.
echo  [4] Web Cockpit Server (Browser Audio and Map Radar)
echo      Command: npx expo start --web
echo.
echo  [5] EAS Cloud Build for Android (Development APK)
echo      Command: eas build --profile development --platform android
echo.
echo  [6] Exit
echo  -------------------------------------------------------------
set /p MODE="Enter your choice (1-6, Default is 1): "

if "%MODE%"=="" set MODE=1
if "%MODE%"=="1" goto RUN_EXPO_CLEAR
if "%MODE%"=="2" goto RUN_ANDROID
if "%MODE%"=="3" goto RUN_BUILD_APK
if "%MODE%"=="4" goto RUN_WEB
if "%MODE%"=="5" goto RUN_EAS
if "%MODE%"=="6" exit /b 0

echo [ERROR] Invalid selection. Please choose 1, 2, 3, 4, 5, or 6.
echo.
goto MENU

:RUN_EXPO_CLEAR
echo.
echo =====================================================================
echo [RIDEX] Starting Expo Server (Clear Cache for iOS and Android)...
echo =====================================================================
echo.
call npx expo start --clear
goto END

:RUN_ANDROID
echo.
echo =====================================================================
echo [RIDEX] Launching Native Android Development Build...
echo [INFO] Compiles native modules with hardware voice intercom support.
echo =====================================================================
echo.
call npx expo run:android
goto END

:RUN_BUILD_APK
echo.
echo =====================================================================
echo [RIDEX] Building Standalone Android Release APK...
echo [OUTPUT] android\app\build\outputs\apk\release\app-release.apk
echo =====================================================================
echo.
cd /d "%~dp0android"
call gradlew.bat assembleRelease --no-daemon
cd /d "%~dp0"
goto END

:RUN_WEB
echo.
echo =====================================================================
echo [RIDEX] Starting Web Cockpit Server...
echo =====================================================================
echo.
call npx expo start --web
goto END

:RUN_EAS
echo.
echo =====================================================================
echo [RIDEX] Triggering EAS Cloud Android Build...
echo =====================================================================
echo.
call eas build --profile development --platform android
goto END

:END
pause
