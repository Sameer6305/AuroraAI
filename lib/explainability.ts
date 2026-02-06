/**
 * Explainability Engine
 * Generates human-readable explanations of how user input
 * influenced the AI-generated image — for auditability and trust.
 */

import { EmotionLabel, ThemeLabel, EMOTION_PALETTES } from './emotion-engine';

export interface ImageExplanation {
  inputSummary: string;
  detectedEmotion: string;
  detectedTheme: string;
  promptReasoning: string;
  styleReasoning: string;
  colorMoodReasoning: string;
  compositionNotes: string;
}

/**
 * Build a structured explanation of image generation decisions.
 * Zero-cost: uses templates + detected data. No API call needed.
 */
export function generateExplanation(params: {
  userInput: {
    activities: string;
    mood: string;
    challenges: string;
    achievements: string;
    theme: string;
  };
  emotion: EmotionLabel;
  emotionConfidence: number;
  secondaryEmotion?: EmotionLabel;
  theme: ThemeLabel;
  emotionKeywords: string[];
  themeKeywords: string[];
  finalPrompt: string;
  style: string;
}): ImageExplanation {
  const {
    userInput, emotion, emotionConfidence, secondaryEmotion,
    theme, emotionKeywords, themeKeywords, finalPrompt, style,
  } = params;

  const palette = EMOTION_PALETTES[emotion] || EMOTION_PALETTES.neutral;
  const confPct = Math.round(emotionConfidence * 100);

  // ── Input Summary ──
  const inputSummary = buildInputSummary(userInput);

  // ── Emotion reasoning ──
  const emotionStr = secondaryEmotion
    ? `**${emotion}** (${confPct}% confidence) with undertones of **${secondaryEmotion}**`
    : `**${emotion}** (${confPct}% confidence)`;

  const detectedEmotion = [
    `Your reflection was analyzed for emotional tone.`,
    `Primary detected emotion: ${emotionStr}.`,
    emotionKeywords.length > 0
      ? `Key signals: "${emotionKeywords.slice(0, 5).join('", "')}".`
      : `No strong keyword signals — defaulted from overall tone.`,
  ].join(' ');

  // ── Theme reasoning ──
  const detectedTheme = [
    `The main theme of your day was identified as **${theme}**.`,
    themeKeywords.length > 0
      ? `This was inferred from mentions of: "${themeKeywords.slice(0, 5).join('", "')}".`
      : `This was the most likely theme based on overall context.`,
  ].join(' ');

  // ── Prompt reasoning ──
  const promptReasoning = [
    `The image prompt was crafted to visually represent your ${theme}-focused day`,
    `with a ${emotion} emotional undertone.`,
    `The scene was designed to capture the essence of your activities`,
    userInput.achievements.trim()
      ? `while highlighting your achievements.`
      : `while acknowledging your challenges.`,
    `Visual style "${style}" was selected to match your chosen theme preference.`,
  ].join(' ');

  // ── Style reasoning ──
  const styleReasoning = [
    `The **${style}** visual style was applied because:`,
    `1) You selected it as your preferred theme,`,
    `2) It complements the "${emotion}" emotional tone,`,
    `3) It creates the strongest visual impact for "${theme}" content.`,
    secondaryEmotion
      ? `The secondary emotion "${secondaryEmotion}" added subtle depth to the composition.`
      : '',
  ].filter(Boolean).join(' ');

  // ── Color/Mood reasoning ──
  const colorMoodReasoning = [
    `Color palette: ${palette.colors}.`,
    `This palette was chosen because "${emotion}" emotions are best expressed through ${palette.mood} tones.`,
    `Lighting: ${palette.lighting} — creating an atmosphere that feels ${palette.atmosphere}.`,
    `The overall mood targets a "${palette.mood}" feeling to mirror your emotional state.`,
  ].join(' ');

  // ── Composition notes ──
  const compositionNotes = [
    `The image was composed for vertical (9:16) wallpaper format.`,
    `Subject placement follows the rule of thirds with atmospheric depth.`,
    `The scene includes environmental elements related to "${theme}"`,
    `wrapped in ${palette.atmosphere} atmosphere.`,
    `Quality enhancers: cinematic composition, 8K resolution, professional lighting.`,
  ].join(' ');

  return {
    inputSummary,
    detectedEmotion,
    detectedTheme,
    promptReasoning,
    styleReasoning,
    colorMoodReasoning,
    compositionNotes,
  };
}

/**
 * Build a concise summary of what the user shared.
 */
function buildInputSummary(input: {
  activities: string;
  mood: string;
  challenges: string;
  achievements: string;
}): string {
  const parts: string[] = [];

  if (input.activities.trim()) {
    parts.push(`You shared that your day involved: "${truncate(input.activities, 120)}".`);
  }
  if (input.mood.trim()) {
    parts.push(`You described your mood as: "${truncate(input.mood, 60)}".`);
  }
  if (input.challenges.trim()) {
    parts.push(`Challenges faced: "${truncate(input.challenges, 100)}".`);
  }
  if (input.achievements.trim()) {
    parts.push(`Key achievements: "${truncate(input.achievements, 100)}".`);
  }

  return parts.join(' ');
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + '...';
}

/**
 * Convert explanation to JSONB-safe object for database storage.
 */
export function explanationToJson(explanation: ImageExplanation): Record<string, string> {
  return {
    input_summary: explanation.inputSummary,
    detected_emotion: explanation.detectedEmotion,
    detected_theme: explanation.detectedTheme,
    prompt_reasoning: explanation.promptReasoning,
    style_reasoning: explanation.styleReasoning,
    color_mood_reasoning: explanation.colorMoodReasoning,
    composition_notes: explanation.compositionNotes,
  };
}
