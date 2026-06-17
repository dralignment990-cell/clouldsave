# 🎵 Music Letter

**감정이나 상황을 들려주면, 그 마음을 노래·그림·영상·편지로 만들어 보내주는 앱.**

소중한 사람에게 단순한 메시지 대신 "음악 편지"를 보냅니다.
감정 한 줄을 입력하면 아래 파이프라인이 자동으로 흐릅니다.

```
감정/상황 입력
   └─▶ 1. 가사 생성 (한국어 발라드, 구조 태그 포함)
        └─▶ 2. Suno 음악 프롬프트 (Style + Lyrics)
             └─▶ 3. 이미지 프롬프트 + 커버 이미지 생성
                  └─▶ 4. 영상 프롬프트 + 무빙 커버 영상 제작·저장
                       └─▶ 5. 감정을 담은 짧은 편지
                            └─▶ 6. 음악 + 영상 + 편지 발송
```

---

## 데모 (실제 생성 결과 — "그리움 / 보고싶음")

`examples/longing/` 에 첫 번째 실제 결과물이 들어 있습니다.

| 단계 | 파일 |
|------|------|
| 가사 | [`lyrics.md`](examples/longing/lyrics.md) — *"보고 싶다는 말"* |
| Suno 프롬프트 | [`suno_prompt.txt`](examples/longing/suno_prompt.txt) |
| 이미지 프롬프트 | [`image_prompt.txt`](examples/longing/image_prompt.txt) |
| 커버 이미지 | `image.png` (Higgsfield · Nano Banana Pro, 16:9 2K) |
| 영상 프롬프트 | [`video_prompt.txt`](examples/longing/video_prompt.txt) |
| 무빙 커버 영상 | `video.mp4` (Higgsfield · Kling 2.6, image-to-video) |
| 편지 | [`letter.md`](examples/longing/letter.md) |

> 음악(Suno)은 위 프롬프트를 Suno에 붙여넣어 생성합니다. 이미지/영상은
> Higgsfield로 실제 생성해 저장했습니다.

---

## 구조

```
clouldsave/
├─ server/            Node + Express 백엔드
│  ├─ index.js        API (/api/plan, /api/example/longing, /api/send) + 미디어 정적 서빙
│  └─ generators.js   "창작 두뇌" — 감정→6단계 산출물 (무드 팔레트 기반)
├─ client/            React + Vite 프론트엔드
│  └─ src/            App.jsx (단계형 UI), components/, api.js
└─ examples/longing/  실제 생성한 그리움 데모 (가사·프롬프트·이미지·영상·편지)
```

---

## 실행

```bash
# 1) 의존성 설치
npm run install:all

# 2) 백엔드 (터미널 A)  → http://localhost:4000
npm run dev:server

# 3) 프론트엔드 (터미널 B) → http://localhost:5173
npm run dev:client
```

브라우저에서 `http://localhost:5173` 접속 → 감정 입력 후 **음악편지 만들기**,
또는 **🌙 그리움 데모 보기** 로 실제 생성된 이미지·영상까지 확인.

---

## 다음 단계 (연동 예정)

현재 가사/편지는 템플릿 + 무드 팔레트로 즉시 동작합니다. 다음 단계에서 실제 API로 교체:

- **가사 / 편지** → Anthropic Claude API (`claude-opus-4-8`)
- **음악** → Suno API (`suno.style` + `lyrics` 전달, 오디오 파일 수신)
- **이미지** → Higgsfield `generate_image` (`nano_banana_pro`)
- **영상** → Higgsfield `generate_video` (`kling2_6`, start_image)
- **발송** → 이메일(SendGrid) / 카카오 알림톡 / SMS
- **음악+영상 합성** → ffmpeg 로 영상 위에 곡 입혀 단일 mp4 제작

연동 지점은 `server/generators.js` 상단 `INTEGRATION` 주석과
`server/index.js` 의 `/api/send` 주석에 표시되어 있습니다.
