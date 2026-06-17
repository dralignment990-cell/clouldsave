import React, { useState } from "react";

// 복사 가능한 프롬프트 블록
export function PromptBlock({ label, text }) {
  const [copied, setCopied] = useState(false);
  if (!text) return null;
  const value = typeof text === "string" ? text : JSON.stringify(text, null, 2);
  const copy = () => {
    navigator.clipboard?.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="block">
      <div className="block-head">
        <span>{label}</span>
        <button className="copy" onClick={copy}>
          {copied ? "복사됨 ✓" : "복사"}
        </button>
      </div>
      <pre>{value}</pre>
    </div>
  );
}

// 단계 카드
export function Step({ n, title, children }) {
  return (
    <section className="step">
      <div className="step-num">{n}</div>
      <div className="step-body">
        <h3>{title}</h3>
        {children}
      </div>
    </section>
  );
}

// 미디어 미리보기 (이미지/영상)
export function MediaPreview({ image, video }) {
  if (!image && !video) {
    return <p className="muted">아직 생성된 미디어가 없습니다. (프롬프트로 생성 가능)</p>;
  }
  return (
    <div className="media">
      {video ? (
        <video src={video} controls loop playsInline poster={image || undefined} />
      ) : (
        image && <img src={image} alt="cover" />
      )}
    </div>
  );
}
