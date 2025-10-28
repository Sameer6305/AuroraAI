import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

const genai = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");

export async function POST(request: NextRequest) {
  try {
    const { prompt, flaggedTerms } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Missing prompt' },
        { status: 400 }
      );
    }

    const systemPrompt = `You are a content safety expert. Your task is to rewrite image generation prompts to make them safe and appropriate while preserving the creative intent.

RULES:
1. Remove all references to public figures, celebrities, politicians
2. Remove all explicit, sexual, or provocative content
3. Remove all violent, gory, or disturbing content
4. Remove all hateful or offensive content
5. Keep the artistic style and emotional tone
6. Make it family-friendly and appropriate for all ages
7. Return ONLY the cleaned prompt, nothing else

Flagged terms to remove/replace: ${flaggedTerms.join(', ')}

Original prompt: "${prompt}"

Rewrite this as a safe, appropriate image generation prompt:`;

    const model = genai.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(systemPrompt);
    const cleanedPrompt = result.response.text().trim();

    return NextResponse.json({
      cleanedPrompt,
      originalPrompt: prompt,
      flaggedTerms,
    });

  } catch (error) {
    console.error('Clean prompt error:', error);
    return NextResponse.json(
      { error: 'Failed to clean prompt' },
      { status: 500 }
    );
  }
}
