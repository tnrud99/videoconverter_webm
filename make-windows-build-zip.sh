#!/bin/bash
# video-converter 폴더 안에서 실행하세요.
# Windows에서 빌드할 수 있도록 ZIP을 만듭니다 (node_modules, dist 제외).

set -e
cd "$(dirname "$0")"

VERSION=$(node -p "require('./package.json').version")
NAME="ve-video-converter-windows-build-${VERSION}"
ZIPFILE="${NAME}.zip"

echo "Creating ${ZIPFILE} for Windows build..."
rm -rf "../.tmp-${NAME}"
mkdir -p "../.tmp-${NAME}/${NAME}"

rsync -a \
  --exclude 'node_modules' \
  --exclude 'dist' \
  --exclude '.git' \
  --exclude '*.zip' \
  --exclude '.DS_Store' \
  --exclude '*.log' \
  . "../.tmp-${NAME}/${NAME}/"

(cd "../.tmp-${NAME}" && zip -r "../video-converter/${ZIPFILE}" "${NAME}")
rm -rf "../.tmp-${NAME}"

echo "Done: ${ZIPFILE}"
echo ""
echo "Windows에서 빌드 방법:"
echo "  1. ${ZIPFILE} 을 Windows PC로 복사"
echo "  2. 압축 해제"
echo "  3. 명령 프롬프트 열고:  cd ${NAME}"
echo "  4. npm install"
echo "  5. npm run build:win"
echo "  6. dist 폴더에서 exe 확인"
