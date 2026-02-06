/**
 * Emotion Detection Engine
 * Analyzes user reflection text to detect emotions and themes.
 * Uses keyword-based NLP (zero cost) + Gemini validation for edge cases.
 */

// ─── Emotion Taxonomy ───────────────────────────────────────────

export type EmotionLabel =
  | 'happy' | 'calm' | 'motivated' | 'grateful'
  | 'stressed' | 'anxious' | 'overwhelmed' | 'tired'
  | 'sad' | 'frustrated' | 'neutral' | 'confident'
  | 'excited' | 'reflective';

export type ThemeLabel =
  | 'work' | 'learning' | 'health' | 'personal'
  | 'social' | 'creative' | 'finance' | 'spiritual';

export interface EmotionResult {
  emotion: EmotionLabel;
  confidence: number;          // 0.0 – 1.0
  secondaryEmotion?: EmotionLabel;
  theme: ThemeLabel;
  emotionKeywords: string[];   // which words triggered
  themeKeywords: string[];
}

// ─── Emotion Lexicon ────────────────────────────────────────────

const EMOTION_LEXICON: Record<EmotionLabel, string[]> = {
  happy:       ['happy', 'joy', 'joyful', 'amazing', 'wonderful', 'great', 'fantastic', 'awesome', 'love', 'delighted', 'cheerful', 'thrilled', 'elated', 'blessed', 'blissful'],
  calm:        ['calm', 'peaceful', 'serene', 'relaxed', 'tranquil', 'quiet', 'composed', 'balanced', 'zen', 'mellow', 'at ease', 'steady', 'centered'],
  motivated:   ['motivated', 'determined', 'driven', 'ambitious', 'inspired', 'pumped', 'fired up', 'focused', 'productive', 'energetic', 'unstoppable', 'goal', 'hustle'],
  grateful:    ['grateful', 'thankful', 'blessed', 'appreciative', 'fortunate', 'lucky', 'content', 'fulfilled'],
  stressed:    ['stressed', 'pressure', 'tense', 'overwhelmed', 'burned out', 'burnout', 'overloaded', 'swamped', 'strained', 'deadline', 'hectic', 'chaos'],
  anxious:     ['anxious', 'worried', 'nervous', 'uneasy', 'restless', 'panicked', 'dread', 'fear', 'uncertain', 'overthinking', 'apprehensive'],
  overwhelmed: ['overwhelmed', 'too much', 'drowning', 'overloaded', 'swamped', 'crushed', 'buried', 'cannot cope', 'breaking point'],
  tired:       ['tired', 'exhausted', 'fatigue', 'drained', 'sleepy', 'weary', 'worn out', 'sluggish', 'low energy', 'lethargic', 'burnt'],
  sad:         ['sad', 'down', 'unhappy', 'depressed', 'lonely', 'heartbroken', 'melancholy', 'gloomy', 'dismal', 'miserable', 'hopeless'],
  frustrated:  ['frustrated', 'annoyed', 'irritated', 'angry', 'mad', 'furious', 'stuck', 'blocked', 'fed up', 'impatient', 'aggravated'],
  neutral:     ['okay', 'fine', 'alright', 'normal', 'average', 'meh', 'so-so', 'uneventful', 'routine'],
  confident:   ['confident', 'proud', 'bold', 'empowered', 'capable', 'strong', 'self-assured', 'accomplished', 'victorious', 'winning'],
  excited:     ['excited', 'ecstatic', 'hyped', 'eager', 'enthusiastic', 'looking forward', 'can\'t wait', 'stoked', 'thrilling'],
  reflective:  ['reflective', 'thoughtful', 'contemplative', 'introspective', 'pondering', 'nostalgic', 'wondering', 'philosophical'],
};

// ─── Theme Lexicon ──────────────────────────────────────────────

const THEME_LEXICON: Record<ThemeLabel, string[]> = {
  work:      ['work', 'job', 'office', 'meeting', 'project', 'client', 'deadline', 'colleague', 'manager', 'boss', 'team', 'presentation', 'corporate', 'business', 'remote', 'commute', 'salary', 'promotion'],
  learning:  ['study', 'studying', 'learn', 'learning', 'exam', 'class', 'lecture', 'homework', 'assignment', 'college', 'university', 'school', 'course', 'programming', 'coding', 'engineering', 'reading', 'research', 'tutorial', 'training', 'certification', 'book'],
  health:    ['exercise', 'gym', 'workout', 'running', 'jogging', 'yoga', 'meditation', 'health', 'fitness', 'diet', 'sleep', 'walk', 'hiking', 'sport', 'swimming', 'cycling', 'mental health', 'therapy', 'doctor', 'headache', 'sick', 'rest'],
  personal:  ['family', 'home', 'chores', 'cooking', 'cleaning', 'laundry', 'garden', 'pet', 'kids', 'parent', 'partner', 'spouse', 'relationship', 'house', 'move', 'errand'],
  social:    ['friend', 'friends', 'hangout', 'party', 'dinner', 'gathering', 'social', 'chat', 'call', 'visit', 'reunion', 'celebrate', 'coffee', 'lunch'],
  creative:  ['art', 'music', 'writing', 'painting', 'design', 'photography', 'creative', 'craft', 'draw', 'sketch', 'compose', 'film', 'video', 'content', 'blog', 'poetry'],
  finance:   ['money', 'budget', 'savings', 'invest', 'expense', 'bills', 'financial', 'income', 'debt', 'tax', 'stock', 'crypto'],
  spiritual: ['pray', 'prayer', 'meditate', 'spiritual', 'gratitude', 'mindful', 'faith', 'church', 'temple', 'worship', 'soul', 'purpose', 'meaning'],
};

// ─── Color/Mood Palette Mapping ─────────────────────────────────

export const EMOTION_PALETTES: Record<EmotionLabel, {
  colors: string;
  mood: string;
  lighting: string;
  atmosphere: string;
}> = {
  happy:       { colors: 'warm golds, sunlit yellows, vibrant oranges', mood: 'bright and uplifting', lighting: 'golden hour sunlight, warm radiance', atmosphere: 'celebratory and lively' },
  calm:        { colors: 'soft blues, gentle lavenders, seafoam greens', mood: 'serene and soothing', lighting: 'soft diffused ambient light, gentle glow', atmosphere: 'peaceful and still' },
  motivated:   { colors: 'bold reds, electric blues, bright whites', mood: 'powerful and dynamic', lighting: 'dramatic spotlighting, sunrise beams', atmosphere: 'charged and purposeful' },
  grateful:    { colors: 'warm ambers, rose golds, honey tones', mood: 'warm and heartfelt', lighting: 'soft warm backlighting, candlelit', atmosphere: 'intimate and appreciative' },
  stressed:    { colors: 'deep grays, muted purples, storm blues', mood: 'tense yet resilient', lighting: 'overcast sky, filtered light through clouds', atmosphere: 'heavy but with breaking light' },
  anxious:     { colors: 'swirling teals, shifting blues, pale greys', mood: 'restless and searching', lighting: 'flickering, uneven ambient light', atmosphere: 'uncertain, atmospheric fog' },
  overwhelmed: { colors: 'dark indigos, scattered neon accents, deep shadows', mood: 'chaotic yet seeking clarity', lighting: 'harsh contrasts with pockets of warmth', atmosphere: 'busy, layered, with a calming focal point' },
  tired:       { colors: 'muted earth tones, soft browns, dusty blues', mood: 'quiet and resting', lighting: 'dim twilight, soft lamplight', atmosphere: 'cozy, winding down' },
  sad:         { colors: 'cool blues, soft grays, gentle purples', mood: 'melancholic but beautiful', lighting: 'overcast, rain-filtered light', atmosphere: 'somber with quiet beauty' },
  frustrated:  { colors: 'burnt oranges, sharp reds, dark grays', mood: 'intense and restless', lighting: 'harsh directional light, deep shadows', atmosphere: 'turbulent with forward momentum' },
  neutral:     { colors: 'balanced grays, soft whites, natural greens', mood: 'even and measured', lighting: 'natural daylight, clean illumination', atmosphere: 'ordinary, grounded' },
  confident:   { colors: 'royal purples, deep golds, midnight blues', mood: 'commanding and assured', lighting: 'dramatic uplighting, stage presence', atmosphere: 'powerful and majestic' },
  excited:     { colors: 'electric pinks, bright cyans, energetic yellows', mood: 'vibrant and explosive', lighting: 'neon glow, dynamic light streaks', atmosphere: 'euphoric, fast-paced' },
  reflective:  { colors: 'soft ochres, twilight purples, misty whites', mood: 'contemplative and deep', lighting: 'golden hour fading into dusk', atmosphere: 'philosophical, time standing still' },
};

// ─── Detection Engine ───────────────────────────────────────────

/**
 * Analyze combined user text and return detected emotion + theme.
 * Pure keyword analysis — zero API calls, zero cost.
 */
export function detectEmotion(input: {
  activities: string;
  mood: string;
  challenges: string;
  achievements: string;
}): EmotionResult {
  // Combine all text fields with mood weighted 3x
  const combinedText = [
    input.mood, input.mood, input.mood,  // triple-weight mood field
    input.activities,
    input.challenges,
    input.achievements,
  ].join(' ').toLowerCase();

  // Score each emotion
  const emotionScores: Record<EmotionLabel, { score: number; keywords: string[] }> = {} as any;

  for (const [emotion, keywords] of Object.entries(EMOTION_LEXICON)) {
    const matched: string[] = [];
    let score = 0;
    for (const kw of keywords) {
      const regex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      const matches = combinedText.match(regex);
      if (matches) {
        score += matches.length;
        matched.push(kw);
      }
    }
    emotionScores[emotion as EmotionLabel] = { score, keywords: matched };
  }

  // Sort by score descending
  const sorted = Object.entries(emotionScores)
    .sort(([, a], [, b]) => b.score - a.score);

  const topEmotion = sorted[0];
  const secondEmotion = sorted[1];
  const totalScore = sorted.reduce((sum, [, v]) => sum + v.score, 0);

  const primaryEmotion: EmotionLabel = topEmotion[1].score > 0
    ? topEmotion[0] as EmotionLabel
    : 'neutral';
  const confidence = totalScore > 0
    ? Math.min(topEmotion[1].score / Math.max(totalScore, 1), 1)
    : 0.3;

  // Detect theme
  const themeScores: Record<ThemeLabel, { score: number; keywords: string[] }> = {} as any;
  const fullText = [input.activities, input.challenges, input.achievements].join(' ').toLowerCase();

  for (const [theme, keywords] of Object.entries(THEME_LEXICON)) {
    const matched: string[] = [];
    let score = 0;
    for (const kw of keywords) {
      const regex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      const matches = fullText.match(regex);
      if (matches) {
        score += matches.length;
        matched.push(kw);
      }
    }
    themeScores[theme as ThemeLabel] = { score, keywords: matched };
  }

  const sortedThemes = Object.entries(themeScores)
    .sort(([, a], [, b]) => b.score - a.score);

  const topTheme: ThemeLabel = sortedThemes[0][1].score > 0
    ? sortedThemes[0][0] as ThemeLabel
    : 'personal';

  return {
    emotion: primaryEmotion,
    confidence: Math.round(confidence * 100) / 100,
    secondaryEmotion: secondEmotion[1].score > 0 ? secondEmotion[0] as EmotionLabel : undefined,
    theme: topTheme,
    emotionKeywords: emotionScores[primaryEmotion]?.keywords || [],
    themeKeywords: themeScores[topTheme]?.keywords || [],
  };
}

// ─── Style Adaptation ───────────────────────────────────────────

export interface StyleModifiers {
  colorPalette: string;
  moodDescriptor: string;
  lightingStyle: string;
  atmosphereNote: string;
  promptPrefix: string;    // injected before the main prompt
  promptSuffix: string;    // quality tags and emotional tags appended
  negativePrompt: string;  // what to avoid
}

/**
 * Generate style modifiers based on detected emotion + theme + user feedback prefs.
 */
export function getStyleModifiers(
  emotion: EmotionLabel,
  theme: ThemeLabel,
  userStyle: string,
  feedbackOverrides?: { preferred_style?: string; preferred_palette?: string }
): StyleModifiers {
  const palette = EMOTION_PALETTES[emotion] || EMOTION_PALETTES.neutral;

  // Apply feedback-learned overrides
  const effectivePalette = feedbackOverrides?.preferred_palette || palette.colors;

  // Theme-specific scene elements
  const themeScenes: Record<ThemeLabel, string> = {
    work:      'professional workspace, laptop, documents, city view through window',
    learning:  'study desk, open books, notebooks, warm desk lamp, knowledge atmosphere',
    health:    'nature trail, fitness elements, fresh air, vitality and movement',
    personal:  'cozy home interior, personal space, comfort objects, warm ambiance',
    social:    'people together, cafe setting, warm social atmosphere, connection',
    creative:  'art studio, creative tools, paint, music instruments, inspiration',
    finance:   'organized desk, planning documents, growth charts, structured space',
    spiritual: 'sacred space, nature, morning light, meditative stillness, sky',
  };

  const sceneElements = themeScenes[theme] || themeScenes.personal;

  return {
    colorPalette: effectivePalette,
    moodDescriptor: palette.mood,
    lightingStyle: palette.lighting,
    atmosphereNote: palette.atmosphere,
    promptPrefix: `[Emotion: ${emotion}, Theme: ${theme}] A scene that feels ${palette.mood}, featuring ${sceneElements}, rendered with ${effectivePalette},`,
    promptSuffix: `${palette.lighting}, ${palette.atmosphere}, highly detailed, professional quality, cinematic composition, 8k resolution, masterpiece`,
    negativePrompt: 'blurry, low quality, distorted, ugly, deformed, watermark, text, signature, duplicate, cropped',
  };
}
