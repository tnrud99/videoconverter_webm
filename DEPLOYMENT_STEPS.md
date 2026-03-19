# 배포 단계 가이드

## 1. 파일 준비 완료 ✅

**생성된 ZIP 파일:** `video-converter-source.zip`

이 파일을 Windows PC로 전송하세요.

---

## 2. Windows에서 할 일

### Step 1: 파일 압축 해제
- `video-converter-source.zip` 다운로드
- 우클릭 → "압축 풀기" 또는 7-Zip 사용

### Step 2: Node.js 확인
```cmd
node --version
npm --version
```
- 없으면: https://nodejs.org 에서 설치

### Step 3: 의존성 설치
```cmd
cd video-converter-source
npm install
```
- 시간이 좀 걸립니다 (몇 분)
- `node_modules` 폴더가 자동 생성됩니다

### Step 4: 빌드 실행
```cmd
npm run build:win
```
- 빌드가 완료되면 `dist` 폴더에 결과물이 생성됩니다

---

## 3. 빌드 결과물

`dist` 폴더에 다음 파일들이 생성됩니다:

### Portable 버전 (권장 배포)
```
VirtueEdit Video Converter 1.0.0.exe
```
- **배포용**: 이 파일만 사용자에게 배포
- 설치 불필요, 바로 실행 가능

### Setup.exe (선택사항)
```
VirtueEdit Video Converter Setup 1.0.0.exe
```
- NSIS가 설치되어 있어야 생성됨
- 설치 프로그램 형태

---

## 4. 배포

**사용자에게 배포할 파일:**
- `VirtueEdit Video Converter 1.0.0.exe` (Portable 버전)

**사용 방법:**
1. exe 파일 다운로드
2. 더블클릭하여 실행
3. WebM 파일 선택
4. 변환 시작

---

## 문제 해결

### npm install이 안 되는 경우
- 인터넷 연결 확인
- 방화벽/프록시 설정 확인
- 관리자 권한으로 실행

### 빌드가 실패하는 경우
- Node.js 버전 확인 (권장: v18 이상)
- `npm cache clean --force` 실행 후 재시도
- `dist` 폴더 삭제 후 재빌드

### FFmpeg 오류가 발생하는 경우
- 빌드 후 `dist/win-unpacked/resources/app.asar.unpacked` 폴더 확인
- FFmpeg 바이너리가 포함되어 있는지 확인
