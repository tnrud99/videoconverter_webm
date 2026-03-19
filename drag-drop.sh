#!/bin/bash

echo ""
echo "========================================"
echo "  WebM to MP4 변환기"
echo "========================================"
echo ""
echo "사용법: 이 파일에 WebM 파일을 드래그 앤 드롭하세요"
echo ""

if [ -z "$1" ]; then
    echo "파일을 드래그 앤 드롭해주세요."
    echo ""
    read -p "Press enter to continue..."
    exit 1
fi

INPUT_FILE="$1"
OUTPUT_FILE="${INPUT_FILE%.*}.mp4"

echo "입력 파일: $INPUT_FILE"
echo "출력 파일: $OUTPUT_FILE"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"$SCRIPT_DIR/webm-to-mp4-converter" "$INPUT_FILE" "$OUTPUT_FILE"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 변환 완료!"
else
    echo ""
    echo "❌ 변환 실패!"
fi

echo ""
read -p "Press enter to continue..."
