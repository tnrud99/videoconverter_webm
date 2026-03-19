# 배포 체크리스트

## ✅ Mac 빌드 완료

### 배포 파일
- **파일명**: `VE.Video.Converter-1.1.0-arm64.dmg`
- **위치**: `dist/VE.Video.Converter-1.1.0-arm64.dmg`
- **크기**: 약 188MB
- **내용**: `VE Video Converter.app` 포함

### 확인 사항
- ✅ DMG 파일 생성 완료
- ✅ 앱 파일 포함 확인
- ✅ FFmpeg 포함 확인
- ✅ 아이콘 512×512 확인

### 홈페이지 배포 방법

1. **DMG 파일 업로드**
   - `dist/VE.Video.Converter-1.1.0-arm64.dmg` 파일을 서버에 업로드
   - 예: `https://www.virtuedit.com/downloads/VE-Video-Converter-1.1.0-arm64.dmg`

2. **다운로드 링크 예시**
   ```html
   <a href="/downloads/VE-Video-Converter-1.1.0-arm64.dmg" download>
     Download for Mac (Apple Silicon)
   </a>
   ```

3. **사용자 안내**
   - DMG 파일 다운로드
   - DMG 파일 더블클릭하여 마운트
   - `VE Video Converter.app`을 Applications 폴더로 드래그
   - 앱 실행

---

## 📦 Windows 빌드 준비

### 소스 ZIP 파일
- **파일명**: `ve-video-converter-windows-build-1.1.0.zip`
- **위치**: 프로젝트 루트
- **용도**: Windows PC에서 빌드하기 위한 소스 코드

### Windows에서 빌드 방법

1. **ZIP 파일 전송**
   - `ve-video-converter-windows-build-1.1.0.zip`을 Windows PC로 전송

2. **압축 해제**
   - ZIP 파일 압축 해제

3. **의존성 설치**
   ```cmd
   cd ve-video-converter-windows-build-1.1.0
   npm install
   ```

4. **빌드 실행**
   ```cmd
   npm run build:win
   ```

5. **결과물**
   - `dist/VE Video Converter 1.1.0.exe` 생성
   - 이 파일을 홈페이지에 업로드

---

## 🌐 홈페이지 배포 체크리스트

### Mac 버전
- [ ] `VE.Video.Converter-1.1.0-arm64.dmg` 서버 업로드
- [ ] 다운로드 링크 생성
- [ ] 사용자 안내 문구 작성
- [ ] 다운로드 테스트

### Windows 버전 (빌드 후)
- [ ] Windows에서 빌드 완료
- [ ] `VE Video Converter 1.1.0.exe` 서버 업로드
- [ ] 다운로드 링크 생성
- [ ] 사용자 안내 문구 작성
- [ ] 다운로드 테스트

---

## 📝 다운로드 페이지 예시

```html
<h2>VE Video Converter 1.1.0</h2>

<h3>Mac (Apple Silicon)</h3>
<p>macOS 10.15 이상, Apple Silicon (M1/M2/M3) 지원</p>
<a href="/downloads/VE-Video-Converter-1.1.0-arm64.dmg" class="download-btn">
  Download for Mac (188MB)
</a>
<p class="download-note">
  다운로드 후 DMG 파일을 더블클릭하여 마운트하고, 
  "VE Video Converter.app"을 Applications 폴더로 드래그하세요.
</p>

<h3>Windows</h3>
<p>Windows 10 이상 지원</p>
<a href="/downloads/VE-Video-Converter-1.1.0.exe" class="download-btn">
  Download for Windows (XXX MB)
</a>
<p class="download-note">
  다운로드 후 실행 파일을 더블클릭하여 실행하세요.
</p>
```

---

## ⚠️ 주의사항

1. **파일 크기**
   - Mac DMG: 약 188MB
   - Windows EXE: 약 150-200MB 예상
   - 서버 스토리지 및 대역폭 확인

2. **다운로드 속도**
   - 큰 파일이므로 CDN 사용 권장
   - 다운로드 진행률 표시 권장

3. **보안**
   - Windows SmartScreen 경고 예상 (코드 서명 없음)
   - 사용자 안내 필요

4. **버전 관리**
   - 새 버전 배포 시 파일명에 버전 번호 포함
   - 이전 버전 다운로드 링크 유지 여부 결정
