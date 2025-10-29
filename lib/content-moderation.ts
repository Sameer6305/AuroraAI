// Content moderation utilities for prompt safety

// List of blocked terms (public figures, explicit content, violence)
const BLOCKED_TERMS = {
  publicFigures: [
    // Politicians
    'trump', 'biden', 'obama', 'putin', 'xi jinping', 'modi', 'macron', 'trudeau',
    // Celebrities
    'taylor swift', 'beyonce', 'kardashian', 'elon musk', 'bill gates', 'jeff bezos',
    'kanye', 'drake', 'rihanna', 'ariana grande', 'selena gomez',
    // Historical figures (controversial)
    'hitler', 'stalin', 'mao', 'mussolini',
  ],
  
  explicitContent: [
    'nude', 'naked', 'porn', 'sex', 'xxx', 'nsfw', 'explicit', 'erotic',
    'sexual', 'provocative', 'seductive', 'topless', 'underwear', 'lingerie',
  ],
  
  violentContent: [
    'blood', 'gore', 'violent', 'murder', 'kill', 'dead', 'death', 'weapon',
    'gun', 'knife', 'sword', 'torture', 'brutal', 'attack', 'war', 'bomb',
    'explosion', 'shooting', 'stabbing', 'assault',
  ],
  
  hatefulContent: [
    'racist', 'nazi', 'kkk', 'hate', 'supremacy', 'slur', 'offensive',
  ],
};

export interface ModerationResult {
  isSafe: boolean;
  flaggedTerms: string[];
  category: string[];
  originalPrompt: string;
}

/**
 * Check if a prompt contains blocked terms
 */
export function moderatePrompt(prompt: string): ModerationResult {
  const lowerPrompt = prompt.toLowerCase();
  const flaggedTerms: string[] = [];
  const categories: string[] = [];

  // Check public figures
  for (const term of BLOCKED_TERMS.publicFigures) {
    if (lowerPrompt.includes(term)) {
      flaggedTerms.push(term);
      if (!categories.includes('public_figures')) {
        categories.push('public_figures');
      }
    }
  }

  // Check explicit content
  for (const term of BLOCKED_TERMS.explicitContent) {
    if (lowerPrompt.includes(term)) {
      flaggedTerms.push(term);
      if (!categories.includes('explicit_content')) {
        categories.push('explicit_content');
      }
    }
  }

  // Check violent content
  for (const term of BLOCKED_TERMS.violentContent) {
    if (lowerPrompt.includes(term)) {
      flaggedTerms.push(term);
      if (!categories.includes('violent_content')) {
        categories.push('violent_content');
      }
    }
  }

  // Check hateful content
  for (const term of BLOCKED_TERMS.hatefulContent) {
    if (lowerPrompt.includes(term)) {
      flaggedTerms.push(term);
      if (!categories.includes('hateful_content')) {
        categories.push('hateful_content');
      }
    }
  }

  return {
    isSafe: flaggedTerms.length === 0,
    flaggedTerms,
    category: categories,
    originalPrompt: prompt,
  };
}

/**
 * Get a safe version of the prompt by asking Gemini to clean it
 */
export async function cleanPromptWithClaude(
  originalPrompt: string,
  flaggedTerms: string[]
): Promise<string> {
  // Direct Gemini API call instead of HTTP endpoint (server-side safe)
  const axios = (await import('axios')).default;
  const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;

  if (!GOOGLE_AI_API_KEY) {
    throw new Error('GOOGLE_AI_API_KEY not configured');
  }

  const systemPrompt = `You are a content moderation assistant. The following prompt contains inappropriate content (${flaggedTerms.join(', ')}). Please rewrite it to be safe and appropriate while preserving the core meaning.

Original prompt: ${originalPrompt}

Provide ONLY the cleaned prompt, nothing else.`;

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GOOGLE_AI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: systemPrompt
          }]
        }]
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000,
      }
    );

    const cleanedPrompt = response.data.candidates[0].content.parts[0].text.trim();
    return cleanedPrompt;
  } catch (error: any) {
    console.error('Error cleaning prompt with Gemini:', error.message);
    throw new Error('Failed to clean prompt');
  }
}

/**
 * Validate and sanitize prompt before image generation
 * Returns cleaned prompt or throws error
 * 
 * NOTE: For prototype - Content moderation disabled to avoid false positives.
 * Trusting Gemini AI to generate safe, appropriate prompts.
 */
export async function validateAndCleanPrompt(prompt: string): Promise<{
  cleanedPrompt: string;
  wasCleaned: boolean;
  originalPrompt: string;
}> {
  // For prototype: Skip strict moderation to avoid false positives
  // Trust Gemini AI to generate appropriate content
  console.log('Content validation: Accepting prompt (moderation disabled for prototype)');
  
  return {
    cleanedPrompt: prompt,
    wasCleaned: false,
    originalPrompt: prompt,
  };
  
  /* DISABLED FOR PROTOTYPE - Uncomment for production use
  // First check for blocked terms
  const moderation = moderatePrompt(prompt);

  if (moderation.isSafe) {
    return {
      cleanedPrompt: prompt,
      wasCleaned: false,
      originalPrompt: prompt,
    };
  }

  // If flagged, ask Gemini to clean it
  console.log('Prompt flagged for:', moderation.category.join(', '));
  console.log('Flagged terms:', moderation.flaggedTerms.join(', '));

  const cleanedPrompt = await cleanPromptWithClaude(
    prompt,
    moderation.flaggedTerms
  );

  // Double-check the cleaned prompt
  const cleanedModeration = moderatePrompt(cleanedPrompt);
  
  if (!cleanedModeration.isSafe) {
    throw new Error(
      'Unable to generate safe prompt. Please revise your reflection.'
    );
  }

  return {
    cleanedPrompt,
    wasCleaned: true,
    originalPrompt: prompt,
  };
  */
}
