# Windows에서 빌드하기 (converter zip 방식)

Windows용 exe는 **반드시 Windows PC에서** 빌드해야 합니다.  
Mac에서 빌드하면 ffmpeg가 제대로 포함되지 않아 실행 시 오류가 날 수 있습니다.

---

## 1. ZIP 만들기 (Mac/개발 PC에서 한 번만)

Windows에 줄 소스를 ZIP으로 만듭니다.

```bash
cd video-converter
chmod +x make-windows-build-zip.sh   # 처음 한 번만
./make-windows-build-zip.sh
```

→ `ve-video-converter-windows-build-1.1.0.zip` (버전은 package.json 기준) 이 생성됩니다.  
이 파일을 Windows PC로 복사(전송)하세요.

---

## 2. Windows에서 할 일

1. **ZIP 압축 해제**  
   `ve-video-converter-windows-build-1.1.0.zip` 을 받은 뒤, 우클릭 → 압축 풀기.

2. **명령 프롬프트** 실행  
   (필요하면 “명령 프롬프트” 우클릭 → **관리자 권한으로 실행**)

3. **압축 푼 폴더로 이동**
   ```cmd
   cd 경로\ve-video-converter-windows-build-1.1.0
   ```
   (예: `cd C:\Users\사용자명\Downloads\ve-video-converter-windows-build-1.1.0`)

4. **의존성 설치**
   ```cmd
   npm install
   ```
   (몇 분 걸릴 수 있음)

5. **빌드**
   ```cmd
   npm run build:win
   ```

6. **결과 확인**  
   `dist` 폴더에 **VE Video Converter 1.1.0.exe** 가 생성됩니다.  
   이 exe 하나만 배포하면 됩니다.

---

## 문제가 생기면

- **심볼릭 링크 / 권한 오류**  
  → 명령 프롬프트를 **관리자 권한으로 실행**한 뒤 다시 `npm install` → `npm run build:win`  
  또는 Windows **설정 → 개발자 모드** 켜기.

- **"ffmpeg.dll을 찾을 수 없습니다"**  
  → 위 순서대로 **Windows에서** `npm install` 후 `npm run build:win` 했는지 확인.  
  (Mac에서 빌드한 exe는 Windows에서 ffmpeg 오류 날 수 있음)

- **"VCRUNTIME140.dll" 등**  
  → [Visual C++ 재배포 패키지](https://learn.microsoft.com/ko-kr/cpp/windows/latest-supported-vc-redist) 설치 후 다시 실행.

자세한 내용은 **BUILD_GUIDE.md** 를 참고하세요.
