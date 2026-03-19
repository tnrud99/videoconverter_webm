@echo off
chcp 65001 >nul
title WebM to MP4 변환기

echo.
echo ========================================
echo   WebM to MP4 변환기
echo ========================================
echo.
echo 사용법: 이 파일에 WebM 파일을 드래그 앤 드롭하세요
echo.

if "%~1"=="" (
    echo 파일을 드래그 앤 드롭해주세요.
    echo.
    pause
    exit /b
)

set INPUT_FILE=%~1
set OUTPUT_FILE=%~dpn1.mp4

echo 입력 파일: %INPUT_FILE%
echo 출력 파일: %OUTPUT_FILE%
echo.

"%~dp0webm-to-mp4-converter.exe" "%INPUT_FILE%" "%OUTPUT_FILE%"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ 변환 완료!
) else (
    echo.
    echo ❌ 변환 실패!
)

echo.
pause
