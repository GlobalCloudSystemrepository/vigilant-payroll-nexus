@echo off
echo Installing Vigilant Payroll Nexus...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed. Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not installed. Please install npm.
    pause
    exit /b 1
)

echo Node.js and npm are installed.
echo.

REM Install dependencies
echo Installing dependencies...
npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies.
    pause
    exit /b 1
)

echo.
echo Dependencies installed successfully!
echo.

REM Create desktop shortcut
echo Creating desktop shortcut...
set "shortcutPath=%USERPROFILE%\Desktop\Vigilant Payroll Nexus.bat"
(
    echo @echo off
    echo cd /d "%~dp0"
    echo echo Starting Vigilant Payroll Nexus...
    echo npm run dev
    echo pause
) > "%shortcutPath%"

echo.
echo Installation completed successfully!
echo.
echo Desktop shortcut created: %shortcutPath%
echo.
echo To start the application:
echo 1. Double-click the desktop shortcut, OR
echo 2. Run 'npm run dev' in this directory
echo.
echo The application will be available at http://localhost:8080
echo.
pause