/**
 * claude.js — Anthropic Claude API 연동 (가사 + 편지 + 프롬프트 창작)
 *
 * ANTHROPIC_API_KEY 가 있으면 claude-opus-4-8 로 감정/상황에 맞는
 * 가사·Suno스타일·이미지/영상 프롬프트·편지를 매번 새로 창작한다.
 * 키가 없으면 호출하지 않고, 호출부(index.js)가 템플릿 생성기로 폴백한다.
 *
 * 구조화 출력(output_config.format)으로 JSON 스키마를 강제해 파싱을 안정화.
 */
import Anthropic from "@anthropic-ai/sdk";

export const hasClaudeKey = !!process.env.ANTHROPIC_API_KEY;

const MODEL = "claude-opus-4-8";

// 생성 결과 JSON 스키마
const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string", description: "곡 제목 (한국어)" },
    lyrics: {
      type: "string",
      description: "구조 태그([Intro][Verse][Chorus][Bridge][Outro] 등)를 포함한 한국어 가사 전문",
    },
    sunoStyle: {
      type: "string",
      description: "Suno 'Style of Music' 입력란에 넣을 영어 스타일 프롬프트 (장르/악기/BPM/무드)",
    },
    imagePrompt: {
      type: "string",
      description: "곡 분위기에 맞는 커버 이미지용 영어 프롬프트 (cinematic, no text)",
    },
    videoPrompt: {
      type: "string",
      description: "커버 이미지를 움직이는 영상용 영어 프롬프트 (느린 카메라 + 앰비언트 사운드)",
    },
    letterOpen: { type: "string", description: "편지 첫 인사 (한국어)" },
    letterBody: { type: "string", description: "감정이 담긴 짧은 편지 본문 (한국어, 4~6문장)" },
    letterClose: { type: "string", description: "편지 맺음말 (한국어)" },
  },
  required: [
    "title",
    "lyrics",
    "sunoStyle",
    "imagePrompt",
    "videoPrompt",
    "letterOpen",
    "letterBody",
    "letterClose",
  ],
};

const SYSTEM = `당신은 '음악 편지'를 만드는 따뜻한 작사가이자 작가입니다.
사용자가 준 감정/상황을 받아 한 사람에게 전하는 음악편지를 창작합니다.
- 가사: 한국어, 진심 어리고 구체적인 이미지. [Intro][Verse][Pre-Chorus][Chorus][Bridge][Final Chorus][Outro] 같은 구조 태그를 포함.
- sunoStyle: 영어. 장르·악기·BPM·키·무드를 콤마로. 보컬 곡 기준.
- imagePrompt / videoPrompt: 영어. 영화적이고 감정적인 한 장면. 텍스트 없음(no text).
- 편지: 한국어. 위로/응원/그리움 등 해당 감정에 맞춰 짧고 진솔하게.
과장 없이 담백하게, 받는 사람이 위로받도록 씁니다.`;

/**
 * Claude로 음악편지 plan 생성. 실패 시 throw → 호출부에서 폴백.
 */
export async function buildPlanWithClaude({ emotion, situation, recipient }) {
  const client = new Anthropic(); // ANTHROPIC_API_KEY 환경변수 사용

  const userMsg =
    `감정: ${emotion || "(미지정)"}\n` +
    `상황: ${situation || "(자유)"}\n` +
    `받는 사람: ${recipient || "(소중한 사람)"}\n\n` +
    `위 정보로 음악편지를 만들어 주세요.`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4000,
    thinking: { type: "adaptive" },
    output_config: {
      effort: "medium",
      format: { type: "json_schema", schema: SCHEMA },
    },
    system: SYSTEM,
    messages: [{ role: "user", content: userMsg }],
  });

  if (response.stop_reason === "refusal") {
    throw new Error("Claude refusal");
  }

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock) throw new Error("Claude 응답에 텍스트 없음");
  const data = JSON.parse(textBlock.text);

  // index.js 의 plan 형태로 정규화 (generators.buildPlan 과 동일 키 구조)
  return {
    meta: { emotion, situation, mood: emotion || "music letter", source: "claude" },
    lyrics: { title: data.title, body: data.lyrics },
    suno: {
      style: data.sunoStyle,
      exclude: "aggressive, edm drop, autotune, rap",
      howto: "Suno Custom Mode → Style 에 style, Lyrics 에 가사 붙여넣기.",
    },
    imagePrompt: { model: "nano_banana_pro", aspect_ratio: "16:9", resolution: "2k", prompt: data.imagePrompt },
    videoPrompt: { model: "kling2_6", duration: 5, aspect_ratio: "16:9", sound: true, prompt: data.videoPrompt },
    letter: { open: data.letterOpen, body: data.letterBody, close: data.letterClose, tone: emotion },
  };
}
