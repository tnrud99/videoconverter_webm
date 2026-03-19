@echo off
REM VE Video Converter 빌드 스크립트 (Windows)

echo 🚀 VE Video Converter 빌드 시작...
echo.

REM Node.js 확인
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js가 설치되어 있지 않습니다.
    echo    https://nodejs.org 에서 설치해주세요.
    exit /b 1
)

echo ✅ Node.js 버전:
node --version
echo ✅ npm 버전:
npm --version
echo.

REM 의존성 확인
if not exist "node_modules" (
    echo 📦 의존성 설치 중...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ 의존성 설치 실패
        exit /b 1
    )
    echo ✅ 의존성 설치 완료
    echo.
)

REM 빌드 타입 선택
echo 빌드 타입을 선택하세요:
echo 1) Windows만 빌드
echo 2) Mac만 빌드 (Mac에서만 가능)
echo 3) Windows + Mac 모두 빌드 (Mac에서만 가능)
set /p choice="선택 (1-3): "

if "%choice%"=="1" (
    echo.
    echo 🪟 Windows 빌드 시작...
    call npm run build:win
) else if "%choice%"=="2" (
    echo.
    echo 🍎 Mac 빌드 시작...
    call npm run build:mac
) else if "%choice%"=="3" (
    echo.
    echo 🪟 Windows + 🍎 Mac 빌드 시작...
    call npm run build:all
) else (
    echo ❌ 잘못된 선택입니다.
    exit /b 1
)

if %errorlevel% equ 0 (
    echo.
    echo ✅ 빌드 완료!
    echo 📁 결과물: dist\ 폴더 확인
) else (
    echo.
    echo ❌ 빌드 실패
    exit /b 1
)

pause
