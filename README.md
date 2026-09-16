# SpinCay by Key

타이핑 속도에 반응하는 데스크탑 고양이 오버레이 앱.

---

## 설치

`OIIA Cat Setup 0.1.0.exe` 를 실행하면 자동 설치됩니다.

설치 후 시작 메뉴 또는 바탕화면 바로가기에서 실행하세요.

---

## 사용법

### 기본 동작

| 상황 | 동작 |
|------|------|
| 아무 키나 누르면 | 고양이가 회전하며 통통 튀고 노래가 재생됩니다 |
| 타이핑 속도가 빠를수록 | 애니메이션과 노래가 함께 빨라집니다 |
| 키 입력을 멈추면 | 2초 후 노래가 멈추고 고양이가 정지합니다 |
| 노래가 끝나면 | 처음부터 자동 반복 재생됩니다 |

### 고양이 조작

- **드래그** — 고양이를 마우스로 끌어 원하는 위치로 이동
- **우클릭** — Play / Pause 메뉴 표시

### 트레이 아이콘 (우측 하단 시계 옆)

- **고양이 숨기기 / 보이기** — 오버레이 토글
- **설정** — 볼륨, 고양이 크기, 감도 조절
- **종료** — 앱 종료

---

## 설정

트레이 아이콘 우클릭 → **설정**

| 항목 | 설명 |
|------|------|
| Volume | 노래 볼륨 (0 ~ 100%) |
| Cat size | 고양이 크기 (40 ~ 500px) |
| Sensitivity | 타이핑 속도 감지 민감도 |
| Reset position | 고양이를 화면 우측 하단으로 초기화 |

---

## 노래 교체

기본 노래를 바꾸려면:

1. 원하는 노래를 MP3 파일로 준비합니다
2. 파일 이름을 `oiia.mp3` 로 변경합니다
3. 아래 경로에 덮어씌웁니다

```
C:\Users\[사용자명]\AppData\Local\Programs\oiia-cat\resources\app\assets\oiia.mp3
```

---

## 개발 환경에서 실행

```bash
# 의존성 설치
npm install

# 앱 실행
npm start

# 설치 파일 빌드
npm run dist
```

**필요 환경:** Node.js 18+, Windows 10/11

---

## 기술 스택

- [Electron](https://www.electronjs.org/) 28
- [uiohook-napi](https://github.com/nicovanbentum/uiohook-napi) — 전역 키보드 훅
- [electron-store](https://github.com/sindresorhus/electron-store) — 설정 저장
