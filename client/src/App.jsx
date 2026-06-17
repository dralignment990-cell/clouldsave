import React, { useState } from "react";
import { api } from "./api.js";
import { PromptBlock, Step, MediaPreview } from "./components/Pieces.jsx";

const PRESETS = [
  { emotion: "그리움 / 보고싶음", situation: "멀리 있어 자주 못 보는 사람에게" },
  { emotion: "응원 / 새로운 시작", situation: "새 도전을 앞둔 친구에게" },
  { emotion: "감사 / 고마움", situation: "늘 곁에 있어준 사람에게" },
];

export default function App() {
  const [form, setForm] = useState({ emotion: "", situation: "", recipient: "" });
  const [plan, setPlan] = useState(null);
  const [media, setMedia] = useState({ image: null, video: null });
  const [loading, setLoading] = useState(false);
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

  // 실제 생성해 저장한 "그리움" 데모 불러오기 (이미지+영상 포함)
  const loadDemo = async () => {
    setError(null);
    setLoading(true);
    try {
      const ex = await api.example();
      setForm({ emotion: ex.meta.emotion, situation: "멀리 있어 자주 못 보는 사람에게", recipient: "" });
      setPlan({
        meta: ex.meta,
        lyrics: { title: ex.meta.title, body: ex.lyrics },
        suno: ex.sunoPrompt,
        imagePrompt: ex.imagePrompt,
        videoPrompt: ex.videoPrompt,
        letter: { body: ex.letter },
        _raw: true,
      });
      setMedia({ image: ex.image, video: ex.video });
    } catch (e) {
      setError(e.error || "데모를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const send = async () => {
    setError(null);
    try {
      const r = await api.send({ to: form.recipient || "소중한 사람", plan });
      setSent(r);
    } catch (e) {
      setError(e.error || "발송에 실패했습니다.");
    }
  };

  return (
    <div className="app">
      <header className="hero">
        <h1>🎵 Music Letter</h1>
        <p>감정을 들려주면, 그 마음을 노래·그림·영상·편지로 만들어 보내드려요.</p>
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
        <input value={form.emotion} onChange={set("emotion")} placeholder="예: 그리움 / 보고싶음" />
        <label>상황 (선택)</label>
        <input value={form.situation} onChange={set("situation")} placeholder="예: 멀리 있어 자주 못 보는 친구에게" />
        <label>받는 사람 (선택)</label>
        <input value={form.recipient} onChange={set("recipient")} placeholder="예: 지민" />
        <div className="actions">
          <button className="primary" onClick={createPlan} disabled={loading}>
            {loading ? "만드는 중…" : "음악편지 만들기"}
          </button>
          <button className="ghost" onClick={loadDemo} disabled={loading}>
            🌙 그리움 데모 보기 (실제 생성 결과)
          </button>
        </div>
        {error && <p className="error">{error}</p>}
      </section>

      {plan && (
        <section className="card result">
          <h2>{plan.lyrics?.title || "음악편지"}</h2>
          <p className="muted">감정: {plan.meta?.mood || plan.meta?.emotion}</p>

          <Step n="2" title="가사">
            <PromptBlock label="Lyrics" text={plan.lyrics?.body} />
          </Step>

          <Step n="3" title="Suno 음악 프롬프트">
            {plan._raw ? (
              <PromptBlock label="Suno" text={plan.suno} />
            ) : (
              <>
                <PromptBlock label="Style of Music" text={plan.suno?.style} />
                <PromptBlock label="제외(Exclude)" text={plan.suno?.exclude} />
                <p className="muted">{plan.suno?.howto}</p>
              </>
            )}
          </Step>

          <Step n="4" title="이미지">
            <MediaPreview image={media.image} />
            <PromptBlock
              label="Image Prompt"
              text={plan._raw ? plan.imagePrompt : plan.imagePrompt?.prompt}
            />
          </Step>

          <Step n="5" title="영상">
            <MediaPreview video={media.video} image={media.image} />
            <PromptBlock
              label="Video Prompt"
              text={plan._raw ? plan.videoPrompt : plan.videoPrompt?.prompt}
            />
          </Step>

          <Step n="6" title="편지">
            <div className="letter">
              {plan.letter?.open && <p className="letter-open">{plan.letter.open}</p>}
              <p className="letter-body">{plan.letter?.body}</p>
              {plan.letter?.close && <p className="letter-close">{plan.letter.close}</p>}
            </div>
          </Step>

          <div className="actions">
            <button className="primary" onClick={send}>
              💌 음악편지 보내기
            </button>
          </div>
          {sent && (
            <p className="success">
              ✓ {sent.message} (공유 링크: <code>{sent.shareUrl}</code>)
            </p>
          )}
        </section>
      )}

      <footer className="foot">
        Music Letter · 감정 → 가사 → 음악 → 그림 → 영상 → 편지 파이프라인 · v0.1
      </footer>
    </div>
  );
}
