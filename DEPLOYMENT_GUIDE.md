# Video Converter 배포 가이드

## 📦 파일 크기 및 제한사항

- **Windows EXE**: 169MB
- **Mac ZIP**: 182MB
- **Vercel Hobby 플랜 제한**: 100MB (초과)
- **Vercel Pro 플랜 제한**: 1GB (가능하나 비용 발생)

## ✅ 권장 방법: GitHub Releases + jsDelivr CDN

이미지처럼 CDN을 사용하는 것이 가장 좋습니다:
- ✅ 무료
- ✅ 빠른 다운로드 속도
- ✅ Vercel 서버 비용 절감
- ✅ 대역폭 제한 없음

### 배포 단계

#### 1. GitHub Releases에 파일 업로드

**새 저장소 사용:**
```
https://github.com/tnrud99/videoconverter_webm/releases/new
```

**단계:**

1. **위 링크로 이동하여 Releases 생성**

2. **태그 생성** (예: `v1.1.0`)
   - Tag: `v1.1.0` (새 태그 생성)
   - Release title: `VE Video Converter 1.1.0`

3. **파일 업로드** (드래그 앤 드롭 또는 파일 선택)
   - `VE.Video.Converter.exe` (Windows, 169MB)
   - `VE.Video.Converter-1.1.0-arm64.dmg` (Mac, 188MB)
   
   📍 파일 위치: `video-converter/dist/` 폴더

4. **License 선택**
   - **MIT** (권장): package.json과 일치, 오픈소스로 명확

5. **Release notes 작성** (선택사항)
   ```
   ## VE Video Converter 1.1.0
   
   - WebM to MP4 conversion
   - Quality settings (CRF 18-26)
   - Resolution options (360p to 2160p)
   - Audio bitrate options (128-320 kbps)
   - Portable application (no installation needed)
   ```

6. **"Publish release" 클릭**

#### 2. jsDelivr CDN URL 생성

jsDelivr은 GitHub Releases의 파일을 자동으로 CDN으로 서빙합니다.

**방법 1: GitHub Releases 직접 링크 (권장)**
Releases에 업로드한 파일의 다운로드 URL을 그대로 사용:
```
Windows: https://github.com/tnrud99/videoconverter_webm/releases/download/v1.1.0/VE.Video.Converter.exe
Mac: https://github.com/tnrud99/videoconverter_webm/releases/download/v1.1.0/VE.Video.Converter-1.1.0-arm64.dmg
```

**방법 2: jsDelivr CDN 사용**
Releases 파일을 jsDelivr로 서빙하려면 저장소의 특정 경로에 파일이 있어야 합니다.
대신 GitHub Releases의 직접 다운로드 링크를 사용하는 것이 더 간단합니다.

**참고:** GitHub Releases 다운로드 링크는 자동으로 CDN을 통해 제공되므로 추가 설정 불필요합니다.

#### 3. recorder.html 경로 업데이트

현재 상대 경로를 GitHub Releases URL로 변경:

```html
<!-- 변경 전 -->
<a href="../../video-converter/dist/VE Video Converter.exe" download>

<!-- 변경 후 -->
<a href="https://github.com/tnrud99/videoconverter_webm/releases/download/v1.1.0/VE.Video.Converter.exe" download>
```

**Mac DMG도 동일하게:**
```html
<a href="https://github.com/tnrud99/videoconverter_webm/releases/download/v1.1.0/VE.Video.Converter-1.1.0-arm64.dmg" download>
```

## 🔄 대안 방법들

### 방법 2: Vercel Blob Storage (유료)

- Vercel Pro 플랜 필요
- Blob Storage 사용 (비용 발생)
- 장점: Vercel 생태계 통합
- 단점: 비용 발생

### 방법 3: AWS S3 + CloudFront (유료)

- S3에 파일 업로드
- CloudFront CDN 연결
- 장점: 확장성, 성능
- 단점: 비용 발생 (트래픽에 따라)

### 방법 4: 다른 무료 CDN

- **Cloudflare R2**: 무료 티어 제공
- **Backblaze B2**: 무료 티어 제공
- **GitHub Releases 직접 링크**: 무료 (CDN 없음, 느릴 수 있음)

## 📝 현재 프로젝트 구조

현재 이미지들은 다음 CDN을 사용 중:
```
https://cdn.jsdelivr.net/gh/tnrud99/viewer-assets@main/logo/VEfavicon.png
```

같은 방식으로 video-converter 파일들도 배포하면 됩니다.

## ⚠️ 주의사항

1. **파일명 공백 처리**: URL 인코딩 필요 (`%20` 또는 `-` 사용)
2. **버전 관리**: 새 버전 배포 시 태그 업데이트
3. **캐시 무효화**: jsDelivr은 자동 캐시 무효화 (약 7일)

## 🚀 빠른 배포 체크리스트

- [ ] GitHub Releases에 파일 업로드
- [ ] jsDelivr CDN URL 생성
- [ ] recorder.html의 다운로드 링크 업데이트
- [ ] webcam-info-modal의 다운로드 링크 업데이트
- [ ] 테스트 (다운로드 확인)
