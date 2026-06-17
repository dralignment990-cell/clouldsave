/**
 * generators.js — Music Letter 의 "창작 두뇌"
 *
 * 감정/상황을 받아 6단계 산출물을 만든다.
 *   1) 가사 (lyrics)
 *   2) Suno 음악 프롬프트 (suno)
 *   3) 이미지 프롬프트 (imagePrompt)
 *   4) 영상 프롬프트 (videoPrompt)
 *   5) 편지 (letter)
 *   6) 위 전부를 묶은 plan
 *
 * 지금은 "템플릿 + 무드 팔레트" 기반으로 즉시 동작한다.
 * 실제 LLM/생성 API 연동 지점은 아래 INTEGRATION 주석을 참고.
 *
 * INTEGRATION (다음 단계에서 교체):
 *   - 가사/편지 : Anthropic Claude API (claude-opus-4-8) 로 생성
 *   - 음악      : Suno API 에 suno.style + lyrics 전달
 *   - 이미지    : Higgsfield generate_image (nano_banana_pro)
 *   - 영상      : Higgsfield generate_video (kling2_6, start_image)
 */

// 감정별 무드 팔레트 — 색감/악기/카메라/편지 톤을 한 번에 결정한다.
const MOODS = {
  longing: {
    ko: "그리움 / 보고싶음",
    keywords: ["그리움", "보고싶음", "long", "miss", "longing", "그리워"],
    palette: "muted teal-and-amber, blue-hour, soft film grain",
    instruments:
      "fingerpicked acoustic guitar, felt piano, warm analog synth pad, brushed drums",
    bpm: 72,
    key: "A minor to C major",
    scene:
      "a young woman alone beside a large rain-streaked window at dusk, warm lamplight, city bokeh, an empty chair beside her, holding a warm cup of tea",
    camera: "slow gentle push-in, subtle handheld micro-movement",
    letterOpen: "보고 싶은 너에게,",
    letterTone: "잔잔한 위로와 그리움",
  },
  cheer: {
    ko: "응원 / 새로운 시작",
    keywords: ["응원", "시작", "도전", "cheer", "encourage", "start"],
    palette: "warm golden sunrise, hopeful peach and sky-blue",
    instruments:
      "bright acoustic guitar, claps, uplifting piano, soft strings, four-on-the-floor kick",
    bpm: 96,
    key: "C major",
    scene:
      "a person standing at the top of a hill at sunrise, arms loose, a long road ahead glowing with morning light",
    camera: "slow rising crane shot, gentle forward drift",
    letterOpen: "새로운 길 앞에 선 너에게,",
    letterTone: "따뜻한 응원과 용기",
  },
  gratitude: {
    ko: "감사 / 고마움",
    keywords: ["감사", "고마", "thank", "grateful", "gratitude"],
    palette: "warm candlelight amber, soft cream, gentle gold",
    instruments:
      "warm piano, cello, soft acoustic guitar, light vocal harmonies",
    bpm: 80,
    key: "G major",
    scene:
      "a cozy kitchen table at golden hour, two cups of coffee, handwritten note, soft sunlight through linen curtains",
    camera: "slow loving drift across the table, shallow focus",
    letterOpen: "늘 곁에 있어준 너에게,",
    letterTone: "진심 어린 감사",
  },
  yearning_dawn: {
    ko: "그리움 / 보고싶음",
    keywords: [],
    palette: "soft pink dawn, mist over the city, hopeful",
    instruments: "fingerpicked guitar, piano, strings",
    bpm: 72,
    key: "A minor to C major",
    scene: "a window at dawn, mist over a waking city",
    camera: "slow push-in",
    letterOpen: "보고 싶은 너에게,",
    letterTone: "그리움",
  },
};

// 입력 텍스트에서 무드를 추정한다. 못 찾으면 longing 을 기본으로.
export function detectMood(emotion = "", situation = "") {
  const hay = `${emotion} ${situation}`.toLowerCase();
  for (const [id, mood] of Object.entries(MOODS)) {
    if (mood.keywords.some((k) => hay.includes(k.toLowerCase()))) {
      return { id, ...mood };
    }
  }
  return { id: "longing", ...MOODS.longing };
}

// 1) 가사 ---------------------------------------------------------------
export function generateLyrics({ emotion, situation, mood }) {
  // 데모 품질의 한국어 발라드 가사 (구조 태그 포함 → Suno 호환).
  return {
    title: titleFor(mood),
    structure: "[Intro][Verse][Pre-Chorus][Chorus][Verse][Chorus][Bridge][Final Chorus][Outro]",
    body: LYRICS_LIBRARY[mood.id] || LYRICS_LIBRARY.longing,
    note: `감정: ${mood.ko} / 상황: ${situation || "(자유)"}`,
  };
}

// 2) Suno 프롬프트 ------------------------------------------------------
export function generateSunoPrompt({ mood, lyrics }) {
  const style = [
    "warm acoustic ballad",
    "modern K-ballad",
    mood.instruments,
    `${mood.bpm} BPM`,
    mood.key,
    "emotional, heartfelt, cinematic, reverb-soaked",
  ].join(", ");
  return {
    title: lyrics.title,
    style,
    exclude: "aggressive, edm drop, autotune, rap",
    lyrics: lyrics.body,
    howto:
      "Suno Custom Mode → Style of Music 에 style, Lyrics 에 lyrics 붙여넣기. 구조 태그는 그대로 둘 것.",
  };
}

// 3) 이미지 프롬프트 ----------------------------------------------------
export function generateImagePrompt({ mood }) {
  return {
    model: "nano_banana_pro",
    aspect_ratio: "16:9",
    resolution: "2k",
    prompt:
      `A cinematic, deeply emotional photograph evoking ${mood.ko}. ` +
      `${mood.scene}. ${mood.palette}, gentle film grain, shallow depth of field, ` +
      `35mm film aesthetic, soft natural light, quiet and poetic, no text.`,
    negative: "text, watermark, harsh lighting, oversaturated, extra fingers, distorted face",
  };
}

// 4) 영상 프롬프트 ------------------------------------------------------
export function generateVideoPrompt({ mood }) {
  return {
    model: "kling2_6",
    start_image: "(생성된 커버 이미지 job_id)",
    duration: 5,
    aspect_ratio: "16:9",
    sound: true,
    prompt:
      `${mood.camera} on ${mood.scene}. Subtle living-photo motion, ` +
      `${mood.palette}, film grain. Ambient sound matching the mood, faint warm piano notes.`,
  };
}

// 5) 편지 ---------------------------------------------------------------
export function generateLetter({ mood, recipient, situation }) {
  const who = recipient ? `${recipient}에게,` : mood.letterOpen;
  const body = LETTER_LIBRARY[mood.id] || LETTER_LIBRARY.longing;
  return {
    open: who,
    tone: mood.letterTone,
    body,
    close: "언제나 네 편인 사람이.",
  };
}

// 6) 전체 plan ----------------------------------------------------------
export function buildPlan(input) {
  const mood = detectMood(input.emotion, input.situation);
  const lyrics = generateLyrics({ ...input, mood });
  const suno = generateSunoPrompt({ mood, lyrics });
  const imagePrompt = generateImagePrompt({ mood });
  const videoPrompt = generateVideoPrompt({ mood });
  const letter = generateLetter({ mood, recipient: input.recipient, situation: input.situation });
  return {
    meta: { emotion: input.emotion, situation: input.situation, mood: mood.ko, moodId: mood.id },
    lyrics,
    suno,
    imagePrompt,
    videoPrompt,
    letter,
  };
}

// --- 콘텐츠 라이브러리 (데모) -----------------------------------------
function titleFor(mood) {
  return (
    { longing: "보고 싶다는 말", cheer: "다시, 시작", gratitude: "고마운 사람" }[mood.id] ||
    "보고 싶다는 말"
  );
}

const LYRICS_LIBRARY = {
  longing: `[Intro]
(허밍) 음… 오늘도 너의 안부를 묻는 밤

[Verse 1]
창밖에 비가 내려 너의 도시도 그럴까
식어버린 찻잔처럼 하루가 또 저물어

[Pre-Chorus]
별것 아닌 얘기들이 자꾸 목에 걸려
전하지 못한 말이 오늘 밤 너무 길어

[Chorus]
보고 싶다는 말, 이 한마디가 어려워서
밤하늘에 적어 너에게 보내
멀리 있어도 같은 달을 보잖아
그 빛이 너에게 닿기를, 닿기를

[Bridge]
혹시 오늘 많이 힘들었다면
이 노래가 너의 어깨를 토닥이길

[Final Chorus]
보고 싶다는 말, 이제는 망설이지 않을게
밤하늘 가득 너의 이름을 적어
멀리 있어도 우린 이어져 있어
그 빛이 너에게 닿기를, 닿았기를

[Outro]
(허밍) 음… 잘 자, 내일 또 별을 보낼게`,
  cheer: `[Verse 1]
어제의 무게는 내려놓아도 돼
오늘의 너는 어제보다 단단해

[Chorus]
괜찮아 다시 시작이야
넘어진 만큼 더 멀리 갈 거야
해가 떠오르듯 너도 떠올라
이 길의 끝엔 네가 있어

[Outro]
한 걸음, 또 한 걸음, 함께 갈게`,
  gratitude: `[Verse 1]
말로는 다 못 한 고마움이 있어
당연한 줄 알았던 너의 따뜻함

[Chorus]
고마워, 그 한마디로는 부족해
네가 있어 내 하루가 환했어
받은 만큼 다 돌려주고 싶어
오래오래 네 곁에 있을게

[Outro]
고마워, 정말 고마워`,
};

const LETTER_LIBRARY = {
  longing: `요즘 네 생각을 참 많이 해. 거리가 멀어 자주 못 보지만,
그래서 더 또렷하게 네가 소중하다는 걸 느껴.
혹시 많이 지쳐 있다면, 정말 잘 버티고 있다고 말해주고 싶어.
힘들 땐 이 노래랑 영상을 틀어놓고, 잠깐 나랑 같은 하늘 아래
있다고 생각해줘. 곧 만나러 갈게. 보고 싶어, 많이.`,
  cheer: `새로운 길 앞에서 떨리는 거, 그게 네가 진심이라는 증거야.
잘하지 않아도 괜찮아. 그냥 한 걸음만 내디뎌 봐.
넘어지면 손 잡아줄게. 멀리서도 늘 네 편으로 응원하고 있어.
너는 생각보다 훨씬 강한 사람이야.`,
  gratitude: `늘 곁에 있어줘서 고마워. 당연한 게 아니라는 걸 알아.
네가 건넨 작은 다정함들이 내 하루를 얼마나 환하게 했는지.
이 노래에 그 마음을 담았어. 오래오래 곁에 있고 싶어.
정말, 고마워.`,
};
