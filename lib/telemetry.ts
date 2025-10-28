// Telemetry utilities for tracking generation usage

interface TelemetryLog {
  userId: string;
  generator: 'Stable-Diffusion' | 'Gemini';
  timeMs: number;
  cost?: number;
  promptLength?: number;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

/**
 * Estimated costs per generation (in USD) - ALL FREE NOW!
 */
const GENERATION_COSTS = {
  'Stable-Diffusion': 0, // FREE via Hugging Face
  'Gemini': 0, // FREE - Gemini 1.5 Flash (1,500 requests/day)
};

/**
 * Calculate cost based on generator type
 */
export function calculateCost(
  generator: 'Stable-Diffusion' | 'Gemini',
  tokens?: number
): number {
  // All free now!
  return GENERATION_COSTS[generator] || 0;
}

/**
 * Log generation telemetry to Supabase
 */
export async function logGeneration(data: TelemetryLog): Promise<void> {
  try {
    const response = await fetch('/api/telemetry/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      console.error('Failed to log telemetry:', await response.text());
    }
  } catch (error) {
    console.error('Telemetry logging error:', error);
    // Don't throw - telemetry failures shouldn't break the app
  }
}

/**
 * Get user usage statistics
 */
export async function getUserUsageStats(userId: string): Promise<any> {
  try {
    const response = await fetch(`/api/telemetry/stats?userId=${userId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch usage stats');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching usage stats:', error);
    return null;
  }
}
