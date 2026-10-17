@echo off
setlocal enabledelayedexpansion
title RIDEX V3 — Stop All Servers

echo =====================================================================
echo  STOPPING RIDEX DEVELOPMENT SERVERS AND BACKGROUND PROCESSES
echo =====================================================================
echo.

echo [1/3] Checking and stopping processes on Metro Bundler port (8081)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8081" ^| findstr "LISTENING"') do (
    echo   - Terminating process PID %%a on port 8081...
    taskkill /F /PID %%a >nul 2>&1
)

echo [2/3] Checking and stopping processes on Web/Dev ports (8082, 19000, 19001)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8082" ^| findstr "LISTENING"') do (
    echo   - Terminating process PID %%a on port 8082...
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":19000" ^| findstr "LISTENING"') do (
    echo   - Terminating process PID %%a on port 19000...
    taskkill /F /PID %%a >nul 2>&1
)

echo [3/3] Stopping Gradle Daemons if active...
cd /d "%~dp0android" >nul 2>&1
if exist "gradlew.bat" (
    call gradlew.bat --stop >nul 2>&1
)
cd /d "%~dp0"

echo.
echo =====================================================================
echo [SUCCESS] All RIDEX development and Metro server processes stopped.
echo =====================================================================
echo.
ping 127.0.0.1 -n 3 >nul
exit /b 0
