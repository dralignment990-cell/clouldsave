/**
 * mailer.js — 음악편지 이메일 발송
 *
 * SMTP 환경변수(SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS)가 있으면
 * nodemailer 로 실제 이메일을 보낸다. 없으면 발송하지 않고 미리보기 HTML만 반환.
 */
import nodemailer from "nodemailer";

export const hasSmtp = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

let transporter = null;
function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transporter;
}

/**
 * 음악편지 HTML 본문 구성. (제목 이미지 + 음원 링크 + 편지)
 */
export function renderEmailHtml({ title, emotion, imageUrl, audioUrl, letter }) {
  const open = letter?.open || "";
  const body = (letter?.body || "").replace(/\n/g, "<br>");
  const close = letter?.close || "";
  return `<!doctype html><html lang="ko"><body style="margin:0;background:#0f1320;font-family:-apple-system,'Apple SD Gothic Neo','Noto Sans KR',sans-serif;color:#eef1f8">
  <div style="max-width:600px;margin:0 auto;padding:24px 18px">
    <div style="text-align:center;color:#97a0b8;font-size:13px;letter-spacing:.06em">🎵 누군가 당신에게 음악편지를 보냈어요</div>
    ${imageUrl ? `<img src="${imageUrl}" alt="${title}" style="width:100%;border-radius:16px;margin:16px 0;display:block"/>` : ""}
    <h1 style="text-align:center;font-size:26px;margin:6px 0 2px">${title || "음악편지"}</h1>
    <div style="text-align:center;color:#97a0b8;font-size:13px;margin-bottom:18px">감정 · ${emotion || ""}</div>
    ${audioUrl ? `<div style="text-align:center;margin:8px 0 20px">
      <a href="${audioUrl}" style="display:inline-block;background:#8fa7ff;color:#0b1020;font-weight:700;padding:12px 22px;border-radius:12px;text-decoration:none">🎧 노래 듣기</a>
    </div>` : ""}
    <div style="background:#1b2238;border:1px solid #2a3450;border-radius:14px;padding:22px;font-family:'Nanum Myeongjo','Noto Serif KR',serif">
      ${open ? `<p style="font-weight:700;margin:0 0 12px">${open}</p>` : ""}
      <p style="white-space:normal;margin:0 0 16px;line-height:1.8">${body}</p>
      ${close ? `<p style="color:#f3c178;text-align:right;margin:0">${close}</p>` : ""}
    </div>
    <p style="text-align:center;color:#97a0b8;font-size:12px;margin-top:24px">Music Letter · 감정을 노래·그림·편지로</p>
  </div>
</body></html>`;
}

/**
 * 이메일 발송 (SMTP 있으면 실제 발송).
 */
export async function sendEmail({ to, subject, html }) {
  if (!hasSmtp) {
    return { sent: false, reason: "no_smtp", preview: html };
  }
  const from = process.env.MAIL_FROM || process.env.SMTP_USER;
  const info = await getTransporter().sendMail({ from, to, subject, html });
  return { sent: true, messageId: info.messageId };
}
