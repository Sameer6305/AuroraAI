/**
 * AI Reflection Agent
 * Transforms user's daily reflection into an image generation prompt
 */

interface UserReflection {
  activities: string;
  mood: string;
  challenges: string;
  achievements: string;
  theme: string;
  email?: string;
}

interface ImagePromptResponse {
  prompt: string;
  generator: "Imagen-3" | "Midjourney";
  style: "anime" | "realistic" | "cyberpunk" | "minimalist";
  size: "2048x3620";
  vibe: string;
}

/**
 * Generates an image prompt based on user's daily reflection
 * @param userAnswers - User's daily reflection data
 * @returns JSON object with image generation parameters
 */
export function generateImagePrompt(userAnswers: UserReflection): ImagePromptResponse {
  const { activities, mood, challenges, achievements, theme } = userAnswers;

  // Determine style based on theme
  let style: "anime" | "realistic" | "cyberpunk" | "minimalist";
  let generator: "Imagen-3" | "Midjourney";

  switch (theme.toLowerCase()) {
    case "naruto":
    case "naruto-style":
      style = "anime";
      generator = "Midjourney";
      break;
    case "onepiece":
    case "one piece-style":
    case "one-piece":
      style = "anime";
      generator = "Midjourney";
      break;
    case "realistic":
      style = "realistic";
      generator = "Imagen-3";
      break;
    case "cyberpunk":
      style = "cyberpunk";
      generator = "Midjourney";
      break;
    case "minimalist":
      style = "minimalist";
      generator = "Imagen-3";
      break;
    default:
      style = "anime";
      generator = "Midjourney";
  }

  // Analyze mood and generate vibe
  const vibe = extractVibe(mood, achievements, challenges);

  // Generate detailed prompt
  const prompt = createPrompt(activities, mood, challenges, achievements, style);

  return {
    prompt,
    generator,
    style,
    size: "2048x3620",
    vibe,
  };
}

/**
 * Extract emotional vibe from user inputs
 */
function extractVibe(mood: string, achievements: string, challenges: string): string {
  const moodLower = mood.toLowerCase();
  const hasAchievements = achievements.trim().length > 0;
  const hasChallenges = challenges.trim().length > 0;

  // Positive moods
  if (moodLower.includes("happy") || moodLower.includes("joy") || moodLower.includes("excited")) {
    return "joyful and energetic";
  }
  if (moodLower.includes("calm") || moodLower.includes("peaceful") || moodLower.includes("serene")) {
    return "calm and centered";
  }
  if (moodLower.includes("motivated") || moodLower.includes("determined")) {
    return "determined and focused";
  }
  if (moodLower.includes("grateful") || moodLower.includes("thankful")) {
    return "grateful and warm";
  }

  // Challenging moods with growth
  if (hasAchievements && hasChallenges) {
    return "resilient and hopeful";
  }
  if (moodLower.includes("tired") || moodLower.includes("exhausted")) {
    return "reflective and restful";
  }
  if (moodLower.includes("stressed") || moodLower.includes("anxious")) {
    return "introspective and searching";
  }

  // Default
  return "thoughtful and evolving";
}

/**
 * Create detailed cinematic prompt based on style
 */
function createPrompt(
  activities: string,
  mood: string,
  challenges: string,
  achievements: string,
  style: "anime" | "realistic" | "cyberpunk" | "minimalist"
): string {
  const moodLower = mood.toLowerCase();
  const activitiesLower = activities.toLowerCase();

  if (style === "anime") {
    return createAnimePrompt(activitiesLower, moodLower, challenges, achievements);
  } else if (style === "realistic") {
    return createRealisticPrompt(activitiesLower, moodLower, challenges, achievements);
  } else if (style === "cyberpunk") {
    return createCyberpunkPrompt(activitiesLower, moodLower, challenges, achievements);
  } else {
    return createMinimalistPrompt(activitiesLower, moodLower, challenges, achievements);
  }
}

function createAnimePrompt(
  activities: string,
  mood: string,
  challenges: string,
  achievements: string
): string {
  const isPositive = mood.includes("happy") || mood.includes("motivated") || mood.includes("excited");
  const hasChallenges = challenges.trim().length > 50;

  // Naruto/One Piece inspired anime style
  if (isPositive && achievements.trim().length > 0) {
    return `A heroic anime character standing on a cliff overlooking a vast ocean at golden hour, wearing a flowing jacket with wind blowing through their hair, determination blazing in their eyes. The sky is painted with vibrant oranges and purples as the sun sets, symbolizing triumph over adversity. Energy auras shimmer around the character as they raise one fist victoriously. The scene captures the spirit of adventure and achievement in classic shonen anime style with dynamic composition and bold colors.`;
  } else if (hasChallenges) {
    return `An anime warrior sitting under a cherry blossom tree during twilight, bandages wrapped around their arms, looking up at the starry sky with quiet resolve. Petals drift through the air illuminated by soft moonlight, creating a melancholic yet hopeful atmosphere. The character's eyes reflect both struggle and inner strength, reminiscent of reflective moments in ninja anime. Atmospheric lighting with deep blues and gentle pinks, cinematic depth of field.`;
  } else {
    return `A peaceful anime scene of a young traveler standing in a sunlit meadow, backpack slung over one shoulder, gazing at floating sky islands in the distance. Warm afternoon light bathes the landscape in golden hues, wildflowers swaying in a gentle breeze. The character's posture shows contemplation and readiness for the journey ahead. Studio-quality anime aesthetics with rich colors and detailed background art in the style of adventure anime.`;
  }
}

function createRealisticPrompt(
  activities: string,
  mood: string,
  challenges: string,
  achievements: string
): string {
  const isCalm = mood.includes("calm") || mood.includes("peaceful");
  const isReflective = mood.includes("reflective") || mood.includes("thoughtful");

  if (isCalm) {
    return `A serene photorealistic scene of a person sitting by a large window during golden hour, warm sunlight streaming through sheer curtains, a steaming cup of tea on the windowsill. The subject gazes peacefully at the city or nature beyond, bathed in soft amber light. Shallow depth of field with bokeh, warm color grading, intimate atmosphere. Shot on medium format camera with natural lighting and cinematic composition.`;
  } else if (isReflective) {
    return `A contemplative photorealistic portrait of an individual walking along a misty forest path at dawn, rays of light piercing through the trees creating volumetric god rays. The scene is captured with rich earth tones, dappled lighting on the forest floor, and a sense of peaceful solitude. Cinematic color grading with teal and orange tones, professional photography quality with dramatic natural lighting.`;
  } else {
    return `A realistic urban scene of a person standing on a rooftop at sunset, overlooking a sprawling cityscape as the sky transitions from warm oranges to deep purples. Wind gently moves their clothing as they stand with quiet confidence, the city lights beginning to twinkle below. Shot with professional cinematography, shallow depth of field, rich color palette, golden hour lighting creating long shadows and warm highlights.`;
  }
}

function createCyberpunkPrompt(
  activities: string,
  mood: string,
  challenges: string,
  achievements: string
): string {
  const isEnergetic = mood.includes("motivated") || mood.includes("energetic") || mood.includes("excited");

  if (isEnergetic) {
    return `A cyberpunk cityscape at night with a lone figure standing on a neon-lit skyscraper edge, electric blue and magenta holographic advertisements reflecting off rain-slicked surfaces. The character wears a sleek tech jacket, digital displays glowing around them as they gaze at the sprawling metropolis below. Heavy rain creates light streaks, volumetric fog from steam vents, cinematic composition with Dutch angle. Blade Runner aesthetic with vibrant neon colors and atmospheric depth.`;
  } else {
    return `A moody cyberpunk scene in a rain-soaked alleyway at night, a solitary figure illuminated by the soft glow of pink and cyan neon signs above. Steam rises from grates, puddles reflect the kaleidoscope of lights, and the atmosphere is thick with noir mystery. The character stands contemplatively under an umbrella, tech implants subtly glowing. Cinematic lighting with strong color contrast, wet surfaces creating light bounces, dystopian future aesthetic.`;
  }
}

function createMinimalistPrompt(
  activities: string,
  mood: string,
  challenges: string,
  achievements: string
): string {
  const isPositive = mood.includes("happy") || mood.includes("grateful") || mood.includes("peaceful");

  if (isPositive) {
    return `A minimalist composition featuring a single human silhouette standing in vast negative space, surrounded by soft gradient colors from warm peach to cool lavender. Clean geometric shapes float gently around the figure, suggesting growth and balance. The scene uses simple forms, smooth lighting transitions, and a calming color palette. Ultra-minimal design with emphasis on empty space, subtle shadows, and harmonious proportions.`;
  } else {
    return `A minimalist vertical wallpaper with a lone figure sitting in meditation pose, centered in a sea of soft gradient background flowing from deep indigo to gentle turquoise. Simple line art elements frame the composition with elegant restraint. Soft diffused lighting creates subtle depth without harsh shadows. Clean modern aesthetic with limited color palette, emphasis on balance and tranquility through negative space.`;
  }
}

/**
 * API-ready function that returns JSON string
 */
export function generateImagePromptJSON(userAnswers: UserReflection): string {
  const result = generateImagePrompt(userAnswers);
  return JSON.stringify(result, null, 2);
}
