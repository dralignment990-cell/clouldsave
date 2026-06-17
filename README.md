# 🎵 Music Letter

**감정이나 상황을 들려주면, 그 마음을 노래·그림·영상·편지로 만들어 보내주는 앱.**

소중한 사람에게 단순한 메시지 대신 "음악 편지"를 보냅니다.
감정 한 줄을 입력하면 아래 파이프라인이 자동으로 흐릅니다.

```
감정/상황 입력
   └─▶ 1. 가사 생성 (한국어, 구조 태그 포함)
        └─▶ 2. 음악 생성 (Suno 프롬프트 / Higgsfield 오디오)
             └─▶ 3. 제목이 박힌 커버 이미지 생성
                  └─▶ 4. 감정을 담은 짧은 편지
                       └─▶ 5. 이메일 주소로 음악편지 발송
```

> **음악편지 한 장 구성:** ①제목이 박힌 이미지 → ②음원 플레이어 → ③편지 본문 → ④이메일 발송.
> (동영상은 포맷에서 제외)

---

## 데모 (실제 생성 결과 — "그리움 / 보고싶음")

`examples/longing/` 에 첫 번째 실제 결과물이 들어 있습니다.

| 단계 | 파일 |
|------|------|
| 가사 | [`lyrics.md`](examples/longing/lyrics.md) — *"보고 싶다는 말"* |
| Suno 프롬프트 | [`suno_prompt.txt`](examples/longing/suno_prompt.txt) |
| 음악 (데모) | `media.json` audio · Higgsfield `sonilo_music`, 30s instrumental |
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

## 🎵 음악 연동 (구현됨)

`POST /api/music` 로 음악을 생성합니다. (`server/music.js`)

- **Suno API**: Suno 공식 셀프서비스 키는 아직 없어, `sunoapi.org` / AIMLAPI
  같은 **게이트웨이**(Suno v5/v4.5 호환)를 사용하는 것이 표준입니다.
  `server/.env` 에 `SUNO_API_KEY` 를 설정하면 **가사 기반 보컬 곡**을 생성합니다.
- **폴백(데모)**: 키가 없으면 `examples/longing/media.json` 의 데모 오디오를
  반환합니다. 데모 음악은 **Higgsfield `sonilo_music`** 로 실제 생성한
  30초 instrumental 입니다.

```bash
cp server/.env.example server/.env   # SUNO_API_KEY 입력 (선택)
```

## ✍️ 가사·편지 생성 (Claude API 연동, 구현됨)

`POST /api/plan` 은 **`ANTHROPIC_API_KEY` 가 있으면 `claude-opus-4-8`** 로
감정/상황에 맞는 가사·Suno스타일·이미지/영상 프롬프트·편지를 **매번 새로 창작**합니다.
(`server/claude.js`, 구조화 출력으로 JSON 스키마 강제) 키가 없으면 템플릿
생성기(`server/generators.js`)로 자동 폴백합니다.

```bash
cp server/.env.example server/.env   # ANTHROPIC_API_KEY 입력 (선택)
```

## 📧 이메일 발송 (구현됨)

`POST /api/send` 는 받는 사람 이메일로 음악편지(제목 이미지 + 음원 링크 + 편지)를
보냅니다. (`server/mailer.js`, nodemailer) **SMTP 환경변수**가 있으면 실제 발송,
없으면 미리보기 HTML을 반환합니다.

```bash
# server/.env 에 SMTP 설정 시 실제 발송
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASS=앱비밀번호
MAIL_FROM=you@gmail.com
```

## 다음 단계 (연동 예정)

- **이미지** → Higgsfield `generate_image` (`nano_banana_pro`, 제목 텍스트 포함)
- **음악 보컬 곡** → Suno 게이트웨이(`SUNO_API_KEY`) 연동
- **발송 채널 확장** → 카카오 알림톡 / SMS

연동 지점: `server/claude.js`(가사·편지), `server/music.js`(음악),
`server/mailer.js`(이메일), `server/generators.js`(템플릿 폴백).
