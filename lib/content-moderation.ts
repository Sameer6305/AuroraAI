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
 * Get a safe version of the prompt by asking Claude to clean it
 */
export async function cleanPromptWithClaude(
  originalPrompt: string,
  flaggedTerms: string[]
): Promise<string> {
  const response = await fetch('/api/clean-prompt', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: originalPrompt,
      flaggedTerms,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to clean prompt');
  }

  const data = await response.json();
  return data.cleanedPrompt;
}

/**
 * Validate and sanitize prompt before image generation
 * Returns cleaned prompt or throws error
 */
export async function validateAndCleanPrompt(prompt: string): Promise<{
  cleanedPrompt: string;
  wasCleaned: boolean;
  originalPrompt: string;
}> {
  // First check for blocked terms
  const moderation = moderatePrompt(prompt);

  if (moderation.isSafe) {
    return {
      cleanedPrompt: prompt,
      wasCleaned: false,
      originalPrompt: prompt,
    };
  }

  // If flagged, ask Claude to clean it
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
}
