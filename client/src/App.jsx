import React, { useState } from "react";
import { api } from "./api.js";
import { PromptBlock } from "./components/Pieces.jsx";

const PRESETS = [
  { emotion: "그리움 / 보고싶음", situation: "멀리 있어 자주 못 보는 사람에게" },
  { emotion: "응원 / 새로운 시작", situation: "새 도전을 앞둔 친구에게" },
  { emotion: "감사 / 고마움", situation: "늘 곁에 있어준 사람에게" },
];

export default function App() {
  const [form, setForm] = useState({ emotion: "", situation: "", recipient: "", email: "" });
  const [plan, setPlan] = useState(null);
  const [media, setMedia] = useState({ image: null, audio: null });
  const [loading, setLoading] = useState(false);
  const [musicLoading, setMusicLoading] = useState(false);
  const [music, setMusic] = useState(null);
  const [sent, setSent] = useState(null);
  const [error, setError] = useState(null);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const createPlan = async () => {
    setError(null);
    setSent(null);
    setLoading(true);
    try {
      const p = await api.plan(form);
      setPlan(p);
    } catch (e) {
      setError(e.error || "생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 실제 생성해 저장한 데모 불러오기 (제목 이미지 + 음악)
  const loadDemo = async () => {
    setError(null);
    setLoading(true);
    try {
      const ex = await api.example();
      setForm({ ...form, emotion: ex.meta.emotion, situation: "멀리 있어 자주 못 보는 사람에게" });
      setPlan({
        meta: ex.meta,
        lyrics: { title: ex.meta.title, body: ex.lyrics },
        suno: ex.sunoPrompt,
        imagePrompt: ex.imagePrompt,
        letter: { body: ex.letter },
        _raw: true,
      });
      setMedia({ image: ex.image, audio: ex.audio });
      if (ex.audio) setMusic({ provider: "demo", audioUrl: ex.audio });
    } catch (e) {
      setError(e.error || "데모를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const makeMusic = async () => {
    setError(null);
    setMusicLoading(true);
    try {
      const style = plan?._raw ? "" : plan?.suno?.style || "";
      const lyrics = plan?.lyrics?.body || "";
      const r = await api.music({ style, lyrics, title: plan?.lyrics?.title });
      setMusic(r);
      if (r.audioUrl) setMedia((m) => ({ ...m, audio: r.audioUrl }));
    } catch (e) {
      setError(e.error || "음악 생성에 실패했습니다.");
    } finally {
      setMusicLoading(false);
    }
  };

  // 이메일로 음악편지 발송
  const send = async () => {
    setError(null);
    setSent(null);
    const l = plan?.letter || {};
    try {
      const r = await api.send({
        email: form.email,
        title: plan?.lyrics?.title || "음악편지",
        emotion: plan?.meta?.mood || plan?.meta?.emotion || form.emotion,
        imageUrl: media.image || "",
        audioUrl: media.audio || "",
        letter: { open: l.open, body: l.body, close: l.close },
      });
      setSent(r);
    } catch (e) {
      setError(e.error || "발송에 실패했습니다.");
    }
  };

  const letter = plan?.letter || {};

  return (
    <div className="app">
      <header className="hero">
        <h1>🎵 Music Letter</h1>
        <p>감정을 들려주면, 그 마음을 노래·그림·편지로 만들어 이메일로 보내드려요.</p>
      </header>

      <section className="card">
        <h2>1. 어떤 마음을 전하고 싶나요?</h2>
        <div className="presets">
          {PRESETS.map((p) => (
            <button key={p.emotion} className="chip" onClick={() => setForm({ ...form, ...p })}>
              {p.emotion}
            </button>
          ))}
        </div>
        <label>감정</label>
        <input value={form.emotion} onChange={set("emotion")} placeholder="예: 응원 / 새로운 시작" />
        <label>상황 (선택)</label>
        <input value={form.situation} onChange={set("situation")} placeholder="예: 새 도전을 앞둔 친구에게" />
        <label>받는 사람 (선택)</label>
        <input value={form.recipient} onChange={set("recipient")} placeholder="예: 민준" />
        <div className="actions">
          <button className="primary" onClick={createPlan} disabled={loading}>
            {loading ? "만드는 중…" : "음악편지 만들기"}
          </button>
          <button className="ghost" onClick={loadDemo} disabled={loading}>
            🌙 데모 보기 (실제 생성 결과)
          </button>
        </div>
        {error && <p className="error">{error}</p>}
      </section>

      {plan && (
        <section className="card result">
          {/* 완성된 음악편지 미리보기: 제목 이미지 → 음원 → 편지 */}
          <div className="postcard">
            <div className="cover">
              {media.image ? <img src={media.image} alt={plan.lyrics?.title} /> : <div className="cover-empty" />}
              <div className="cover-text">
                <div className="cover-emotion">{plan.meta?.mood || plan.meta?.emotion}</div>
                <div className="cover-title">{plan.lyrics?.title || "음악편지"}</div>
              </div>
            </div>

            {media.audio && (
              <div className="audio">
                <audio src={media.audio} controls />
              </div>
            )}

            <div className="letter">
              {letter.open && <p className="letter-open">{letter.open}</p>}
              <p className="letter-body">{letter.body}</p>
              {letter.close && <p className="letter-close">{letter.close}</p>}
            </div>
          </div>

          {/* 음악이 아직 없으면 생성 버튼 */}
          {!media.audio && (
            <div className="actions">
              <button className="primary" onClick={makeMusic} disabled={musicLoading}>
                {musicLoading ? "🎵 작곡 중…" : "🎧 음악 생성"}
              </button>
            </div>
          )}

          {/* 이메일로 발송 */}
          <div className="sendbox">
            <label>받는 사람 이메일</label>
            <div className="send-row">
              <input
                type="email"
                value={form.email}
                onChange={set("email")}
                placeholder="name@example.com"
              />
              <button className="primary" onClick={send} disabled={!form.email}>
                💌 편지 보내기
              </button>
            </div>
            {sent && (
              <p className={sent.sent ? "success" : "muted"}>
                {sent.sent ? "✓ " : "ℹ️ "}
                {sent.message}
              </p>
            )}
          </div>

          {/* 참고용 프롬프트 (접어둠) */}
          <details className="prompts">
            <summary>제작에 쓰인 프롬프트 보기 (가사·Suno·이미지)</summary>
            <PromptBlock label="가사" text={plan.lyrics?.body} />
            <PromptBlock
              label="Suno Style"
              text={plan._raw ? plan.suno : plan.suno?.style}
            />
            <PromptBlock
              label="Image Prompt"
              text={plan._raw ? plan.imagePrompt : plan.imagePrompt?.prompt}
            />
          </details>
        </section>
      )}

      <footer className="foot">
        Music Letter · 감정 → 가사 → 음악 → 그림 → 편지 → 이메일 발송 · v0.2
      </footer>
    </div>
  );
}
