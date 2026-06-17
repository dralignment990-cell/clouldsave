/**
 * music.js — 음악 생성 연동
 *
 * 우선순위:
 *   1) SUNO_API_KEY 가 있으면 Suno 게이트웨이(sunoapi.org 호환)로 실제 곡 생성
 *   2) 없으면 예제 데모 오디오(examples/longing/media.json 의 audio.url) 반환
 *
 * Suno 공식 셀프서비스 키는 아직 없어 sunoapi.org / AIMLAPI 같은
 * 게이트웨이를 쓰는 것이 표준이다. 아래는 docs.sunoapi.org 의 표준 형태.
 *   - 환경변수: SUNO_API_KEY, (선택) SUNO_API_BASE
 *   - 모델: V5 / V4_5PLUS / V4_5 / V4
 */

const SUNO_BASE = process.env.SUNO_API_BASE || "https://api.sunoapi.org";
const SUNO_KEY = process.env.SUNO_API_KEY || "";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Suno 게이트웨이로 곡 생성 (키가 있을 때만 동작).
 * @returns {Promise<{provider, status, audioUrl, title, raw}>}
 */
export async function generateWithSuno({ style, lyrics, title, instrumental = false, model = "V4_5" }) {
  if (!SUNO_KEY) throw new Error("SUNO_API_KEY 미설정");

  // 1) 생성 요청 → taskId
  const start = await fetch(`${SUNO_BASE}/api/v1/generate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SUNO_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      customMode: true,
      instrumental,
      model,
      style,
      title: title || "Music Letter",
      prompt: lyrics, // customMode=true 에서 prompt = 가사
      callBackUrl: process.env.SUNO_CALLBACK_URL || "",
    }),
  }).then((r) => r.json());

  const taskId = start?.data?.taskId || start?.data?.task_id;
  if (!taskId) {
    throw new Error(`Suno 생성 시작 실패: ${JSON.stringify(start).slice(0, 200)}`);
  }

  // 2) 폴링 (record-info)
  for (let i = 0; i < 40; i++) {
    await sleep(6000);
    const info = await fetch(
      `${SUNO_BASE}/api/v1/generate/record-info?taskId=${encodeURIComponent(taskId)}`,
      { headers: { Authorization: `Bearer ${SUNO_KEY}` } }
    ).then((r) => r.json());

    const status = info?.data?.status;
    const items = info?.data?.response?.sunoData || info?.data?.data || [];
    const ready = items.find?.((it) => it.audioUrl || it.audio_url);
    if (ready) {
      return {
        provider: "suno",
        status: "completed",
        audioUrl: ready.audioUrl || ready.audio_url,
        title: ready.title || title,
        raw: info.data,
      };
    }
    if (status && /FAILED|ERROR/i.test(status)) {
      throw new Error(`Suno 생성 실패: ${status}`);
    }
  }
  throw new Error("Suno 생성 타임아웃");
}

/**
 * 통합 진입점. 키 없으면 데모 오디오로 폴백.
 */
export async function generateMusic({ style, lyrics, title, demoAudioUrl }) {
  if (SUNO_KEY) {
    try {
      return await generateWithSuno({ style, lyrics, title });
    } catch (e) {
      return { provider: "suno", status: "error", error: String(e.message || e) };
    }
  }
  // 폴백: 미리 생성해 둔 데모 오디오(Higgsfield sonilo_music)
  return {
    provider: "demo",
    status: demoAudioUrl ? "completed" : "no_key",
    audioUrl: demoAudioUrl || null,
    note: demoAudioUrl
      ? "SUNO_API_KEY 미설정 → 데모 오디오 반환. 실제 보컬 곡은 Suno 키 설정 후 생성됩니다."
      : "SUNO_API_KEY 를 설정하면 가사 기반 보컬 곡을 생성합니다.",
  };
}

export const musicConfig = { hasSunoKey: !!SUNO_KEY, base: SUNO_BASE };
