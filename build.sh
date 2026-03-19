#!/bin/bash

# VE Video Converter 빌드 스크립트 (Mac/Linux)

echo "🚀 VE Video Converter 빌드 시작..."
echo ""

# Node.js 확인
if ! command -v node &> /dev/null; then
    echo "❌ Node.js가 설치되어 있지 않습니다."
    echo "   https://nodejs.org 에서 설치해주세요."
    exit 1
fi

echo "✅ Node.js 버전: $(node --version)"
echo "✅ npm 버전: $(npm --version)"
echo ""

# 의존성 확인
if [ ! -d "node_modules" ]; then
    echo "📦 의존성 설치 중..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 의존성 설치 실패"
        exit 1
    fi
    echo "✅ 의존성 설치 완료"
    echo ""
fi

# 빌드 타입 선택
echo "빌드 타입을 선택하세요:"
echo "1) Windows만 빌드 (Wine 필요, Apple Silicon에서는 제한적)"
echo "2) Mac만 빌드 (권장)"
echo "3) Windows + Mac 모두 빌드 (Wine 필요)"
read -p "선택 (1-3): " choice

case $choice in
    1)
        echo ""
        echo "⚠️  Windows 빌드는 Wine이 필요합니다."
        echo "   Apple Silicon Mac에서는 작동하지 않을 수 있습니다."
        read -p "계속하시겠습니까? (y/n): " confirm
        if [ "$confirm" != "y" ]; then
            echo "빌드 취소됨"
            exit 0
        fi
        echo ""
        echo "🪟 Windows 빌드 시작..."
        npm run build:win
        ;;
    2)
        echo ""
        echo "🍎 Mac 빌드 시작..."
        npm run build:mac
        ;;
    3)
        echo ""
        echo "⚠️  Windows 빌드는 Wine이 필요합니다."
        echo "   Apple Silicon Mac에서는 작동하지 않을 수 있습니다."
        read -p "계속하시겠습니까? (y/n): " confirm
        if [ "$confirm" != "y" ]; then
            echo "빌드 취소됨"
            exit 0
        fi
        echo ""
        echo "🪟 Windows + 🍎 Mac 빌드 시작..."
        npm run build:all
        ;;
    *)
        echo "❌ 잘못된 선택입니다."
        exit 1
        ;;
esac

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 빌드 완료!"
    echo "📁 결과물: dist/ 폴더 확인"
else
    echo ""
    echo "❌ 빌드 실패"
    exit 1
fi
