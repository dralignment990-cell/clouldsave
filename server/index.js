/**
 * Music Letter — backend server
 * 감정/상황 → 가사·Suno·이미지·영상 프롬프트·편지 plan 을 만들고,
 * 완성된 음악편지를 "발송"(outbox 저장 + 공유링크)한다.
 */
import express from "express";
import cors from "cors";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { buildPlan } from "./generators.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const EXAMPLES = path.join(ROOT, "examples");
const OUTBOX = path.join(__dirname, "outbox.json");

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// 생성된 데모 미디어(이미지/영상)와 예제 텍스트를 정적 제공
app.use("/media", express.static(EXAMPLES));

// 헬스체크
app.get("/api/health", (_req, res) => res.json({ ok: true, ts: Date.now() }));

/**
 * POST /api/plan
 * body: { emotion, situation, recipient, tone }
 * → 6단계 산출물(plan) 반환
 */
app.post("/api/plan", (req, res) => {
  const { emotion = "", situation = "", recipient = "", tone = "" } = req.body || {};
  if (!emotion && !situation) {
    return res.status(400).json({ error: "emotion 또는 situation 중 하나는 필요합니다." });
  }
  const plan = buildPlan({ emotion, situation, recipient, tone });
  res.json(plan);
});

/**
 * GET /api/example/longing
 * 실제 생성해 저장해 둔 "그리움" 데모 (가사+음악프롬프트+이미지+영상+편지).
 * 미디어는 /media/longing/* 로 접근.
 */
app.get("/api/example/longing", (_req, res) => {
  const dir = path.join(EXAMPLES, "longing");
  const read = (f) => {
    try {
      return fs.readFileSync(path.join(dir, f), "utf8");
    } catch {
      return null;
    }
  };
  // 로컬에 받아둔 파일이 있으면 우선 사용, 없으면 media.json 의 호스팅 URL 사용.
  let media = {};
  try {
    media = JSON.parse(read("media.json") || "{}");
  } catch {
    media = {};
  }
  const localImage = fs.existsSync(path.join(dir, "image.png"));
  const localVideo = fs.existsSync(path.join(dir, "video.mp4"));
  res.json({
    meta: { emotion: "그리움 / 보고싶음", title: "보고 싶다는 말" },
    lyrics: read("lyrics.md"),
    sunoPrompt: read("suno_prompt.txt"),
    imagePrompt: read("image_prompt.txt"),
    videoPrompt: read("video_prompt.txt"),
    letter: read("letter.md"),
    image: localImage ? "/media/longing/image.png" : media.image?.url || null,
    video: localVideo ? "/media/longing/video.mp4" : media.video?.url || null,
  });
});

/**
 * POST /api/send
 * body: { to, plan, mediaUrls }
 * 데모: outbox.json 에 저장하고 공유 링크 반환.
 * INTEGRATION: 이메일(SendGrid)/카카오 알림톡/SMS 로 교체.
 */
app.post("/api/send", (req, res) => {
  const { to = "", plan = null } = req.body || {};
  if (!to) return res.status(400).json({ error: "받는 사람(to)이 필요합니다." });
  const id = randomUUID();
  const record = { id, to, plan, sentAt: new Date().toISOString() };
  let outbox = [];
  try {
    outbox = JSON.parse(fs.readFileSync(OUTBOX, "utf8"));
  } catch {
    /* 첫 발송 */
  }
  outbox.push(record);
  fs.writeFileSync(OUTBOX, JSON.stringify(outbox, null, 2));
  res.json({ ok: true, id, shareUrl: `/letter/${id}`, message: `${to} 에게 음악편지를 보냈습니다.` });
});

// 프로덕션: 빌드된 client 제공
const clientDist = path.join(ROOT, "client", "dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get("*", (_req, res) => res.sendFile(path.join(clientDist, "index.html")));
}

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🎵 Music Letter server → http://localhost:${PORT}`);
});
