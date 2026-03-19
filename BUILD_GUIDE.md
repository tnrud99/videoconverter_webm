# VE Video Converter 빌드 가이드

Windows와 Mac에서 빌드하는 방법을 안내합니다.

---

## 사전 요구사항

### 공통 요구사항
- **Node.js**: v18 이상 (https://nodejs.org)
- **npm**: Node.js와 함께 설치됨
- **인터넷 연결**: 의존성 다운로드 필요

### Windows 추가 요구사항
- Windows 10 이상
- 관리자 권한 (선택사항, 일부 경우 필요)

### Mac 추가 요구사항
- macOS 10.15 이상
- Xcode Command Line Tools (자동 설치됨)
- **icon.png**: 512×512 픽셀 이상 (Mac 앱 아이콘 필수)

---

## 1. 프로젝트 준비

### Step 1: 프로젝트 폴더로 이동
```bash
cd video-converter
```

### Step 2: 의존성 설치
```bash
npm install
```
- 시간이 걸릴 수 있습니다 (몇 분)
- `node_modules` 폴더가 생성됩니다

---

## 2. Windows 빌드

### ⚠️ 중요: 빌드 플랫폼

**권장 방법:**
- **Windows 빌드는 Windows에서 실행**하는 것이 가장 안정적입니다
- Mac에서 Windows 빌드도 가능하지만 제한이 있습니다 (아래 참고)

### Windows에서 빌드 (권장)

#### 빌드 실행
```bash
npm run build:win
```

#### 빌드 결과물
`dist` 폴더에 다음 파일이 생성됩니다:
```
VE Video Converter 1.1.0.exe
```

### Mac에서 Windows 빌드 (제한적)

#### 요구사항
- **Wine** 설치 필요 (Windows 실행 환경)
- Apple Silicon Mac에서는 호환성 문제가 있을 수 있음

#### Wine 설치 (Mac)
```bash
# Homebrew로 설치
brew install --cask wine-stable
```

#### 빌드 실행
```bash
npm run build:win
```

#### 주의사항
- ⚠️ Apple Silicon (M1/M2/M3) Mac에서는 Wine이 제대로 작동하지 않을 수 있음
- ⚠️ 빌드는 가능하지만 테스트는 Windows에서 해야 함
- ✅ Intel Mac에서는 대부분 정상 작동

### 빌드 결과물 특징
- **Portable 버전**: 설치 불필요, 바로 실행 가능
- **배포용**: 이 파일만 사용자에게 배포하면 됩니다
- 파일 크기: 약 150-200MB (FFmpeg 포함)

### 배포
- `VE Video Converter 1.1.0.exe` 파일만 배포
- 사용자는 다운로드 후 바로 실행 가능

---

## 3. Mac 빌드

### 빌드 실행
```bash
npm run build:mac
```

### 빌드 결과물
`dist` 폴더에 다음 파일이 생성됩니다:
```
VE Video Converter-1.1.0.dmg
```

### hdiutil(DMG) 오류가 날 때
DMG 생성 시 `hdiutil process failed` 오류가 나면 **ZIP 빌드**를 사용하세요:
```bash
npm run build:mac:zip
```
- 결과물: `VE Video Converter-1.1.0-mac.zip`
- ZIP을 풀어 `.app`을 Applications로 옮기면 됨

### 특징
- **DMG 파일**: Mac 설치 이미지 (기본)
- **ZIP**: DMG 대안, hdiutil 불필요
- **배포용**: DMG 또는 ZIP 사용자에게 배포
- 파일 크기: 약 150-200MB (FFmpeg 포함)

### 배포
- `VE Video Converter-1.1.0.dmg` 또는 `*.dmg` / `*.zip` 파일 배포
- DMG: 열어서 앱을 Applications 폴더로 드래그
- ZIP: 압축 해제 후 `.app`을 Applications로 이동

---

## 4. Windows + Mac 동시 빌드

### ⚠️ 중요: 플랫폼 제한

**Mac에서 실행 시:**
- Mac 빌드는 정상 작동 ✅
- Windows 빌드는 Wine 필요 (제한적) ⚠️

**Windows에서 실행 시:**
- Windows 빌드는 정상 작동 ✅
- Mac 빌드는 불가능 ❌ (macOS 필요)

### Mac에서 동시 빌드

#### 빌드 실행
```bash
npm run build:all
```

#### 빌드 결과물
`dist` 폴더에 두 플랫폼의 빌드 결과물이 모두 생성됩니다:
```
dist/
  ├── VE Video Converter 1.1.0.exe (Windows, Wine 필요)
  └── VE Video Converter-1.1.0.dmg (Mac, 정상 작동)
```

#### 주의사항
- Windows 빌드를 위해서는 Wine이 설치되어 있어야 함
- Apple Silicon Mac에서는 Windows 빌드가 실패할 수 있음

### 권장 방법

**각 플랫폼에서 해당 플랫폼용 빌드:**
- Mac에서: `npm run build:mac` (Mac 빌드만)
- Windows에서: `npm run build:win` (Windows 빌드만)

이 방법이 가장 안정적이고 권장됩니다.

---

## 5. 빌드 확인

### Windows
1. `dist` 폴더에서 `.exe` 파일 확인
2. 더블클릭하여 실행 테스트
3. WebM 파일 변환 테스트

### Mac
1. `dist` 폴더에서 `.dmg` 파일 확인
2. DMG를 열어 앱 실행 테스트
3. WebM 파일 변환 테스트

---

## 문제 해결

### icon.png must be at least 512x512
Mac 빌드 시 `icon.png`가 **512×512 픽셀 이상**이어야 합니다.
```bash
# Mac에서 아이콘 크기 확인
sips -g pixelWidth -g pixelHeight icon.png

# 512×512로 리사이즈 (sips 사용)
sips -z 512 512 icon.png
```

### hdiutil process failed (DMG 생성 실패)
DMG 생성 시 `hdiutil` 오류가 나면 **ZIP 빌드**를 사용하세요:
```bash
npm run build:mac:zip
```
- ZIP을 풀면 `VE Video Converter.app`이 생성됩니다.
- 터미널/CI에서 빌드할 때 sandbox 제한으로 hdiutil이 실패하는 경우도 있습니다. 로컬 터미널에서 `npm run build:mac`을 다시 시도해 보세요.

### Mac에서 Windows 빌드 실패
```bash
# Wine 설치 확인
wine --version

# Wine이 없으면 설치
brew install --cask wine-stable

# Apple Silicon Mac에서는 Wine이 제대로 작동하지 않을 수 있음
# 이 경우 Windows PC에서 빌드하는 것을 권장
```

### npm install 실패
```bash
# 캐시 정리 후 재시도
npm cache clean --force
npm install
```

### 빌드 실패
```bash
# dist 폴더 삭제 후 재빌드
rm -rf dist  # Mac/Linux
rmdir /s dist  # Windows
npm run build:win  # 또는 build:mac
```

### Node.js 버전 확인
```bash
node --version  # v18 이상이어야 함
npm --version
```

### FFmpeg 포함 확인
빌드 후 다음 경로에서 FFmpeg 확인:
- **Windows**: `dist/win-unpacked/resources/app.asar.unpacked/node_modules/ffmpeg-static/...`
- **Mac**: `dist/mac/VE Video Converter.app/Contents/Resources/app.asar.unpacked/node_modules/ffmpeg-static/...`

---

## 빌드 옵션 커스터마이징

### package.json 수정

#### Windows 빌드 타입 변경
```json
"win": {
  "target": "nsis"  // 설치 프로그램으로 변경
}
```

#### Mac 빌드 타입 변경
```json
"mac": {
  "target": "zip"  // ZIP 파일로 변경
}
```

---

## 배포 체크리스트

빌드 완료 후 확인사항:

- [ ] Windows `.exe` 파일이 정상 실행되는가?
- [ ] Mac `.dmg` 파일이 정상 실행되는가?
- [ ] WebM 파일 변환이 정상 작동하는가?
- [ ] 모든 옵션(해상도, 품질)이 정상 작동하는가?
- [ ] 파일 크기가 적절한가? (150-200MB)
- [ ] 아이콘이 정상 표시되는가?

---

## 버전 업데이트

새 버전 빌드 시:
1. `package.json`의 `version` 수정
2. 빌드 실행
3. 결과물 파일명에 새 버전이 자동 반영됨

---

## 추가 정보

- **빌드 시간**: 약 5-10분 (플랫폼에 따라 다름)
- **필요한 디스크 공간**: 약 1GB (빌드 중 임시 파일 포함)
- **인터넷 사용량**: 약 200-300MB (의존성 다운로드)
