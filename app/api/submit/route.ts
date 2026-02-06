import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { validateAndCleanPrompt } from "@/lib/content-moderation";
import { logGeneration } from "@/lib/telemetry";
import { detectEmotion, getStyleModifiers } from "@/lib/emotion-engine";
import { generateExplanation, explanationToJson } from "@/lib/explainability";

interface UserAnswers {
  activities: string;
  mood: string;
  challenges: string;
  achievements: string;
  theme: string;
  email?: string;
}

interface ImagePrompt {
  prompt: string;
  generator: "Stable-Diffusion";
  style: string;
  size: string;
  vibe: string;
}

export async function POST(request: NextRequest) {
  let userId: string | undefined;
  
  try {
    const userAnswers: UserAnswers = await request.json();
    
    console.log('Received submission:', { ...userAnswers, activities: userAnswers.activities?.substring(0, 50) + '...' });
    
    const { activities, mood, challenges, achievements, theme } = userAnswers;
    
    if (!activities || !mood || !challenges || !achievements || !theme) {
      return NextResponse.json(
        { error: "Missing required fields: activities, mood, challenges, achievements, theme" },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database not configured. Please set SUPABASE environment variables." },
        { status: 503 }
      );
    }

    // ─── Step 1: Authenticate user ──────────────────────────────
    const authHeader = request.headers.get('authorization');
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
      
      if (user && !authError) {
        userId = user.id;
      } else {
        const { data: anonUser, error: anonError } = await supabaseAdmin
          .from("users")
          .insert({ email: `anon-${crypto.randomUUID()}@temp.local` })
          .select("id")
          .single();
        if (anonError || !anonUser) throw new Error("Failed to create user session");
        userId = anonUser.id;
      }
    } else if (userAnswers.email) {
      const { data: existingUser } = await supabaseAdmin
        .from("users").select("id").eq("email", userAnswers.email).single();

      if (existingUser) {
        userId = existingUser.id;
      } else {
        const { data: newUser, error: userError } = await supabaseAdmin
          .from("users").insert({ email: userAnswers.email }).select("id").single();
        if (userError || !newUser) throw new Error("Failed to create user account");
        userId = newUser.id;
      }
    } else {
      const { data: anonUser, error: anonError } = await supabaseAdmin
        .from("users")
        .insert({ email: `anon-${crypto.randomUUID()}@temp.local` })
        .select("id").single();
      if (anonError || !anonUser) throw new Error("Failed to create user session");
      userId = anonUser.id;
    }

    // ─── Step 1.5: Rate limiting (2/day) ────────────────────────
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const { data: todayResponses } = await supabaseAdmin
      .from("daily_responses").select("id")
      .eq("user_id", userId)
      .gte("created_at", todayStart.toISOString())
      .lte("created_at", todayEnd.toISOString());

    if (todayResponses && todayResponses.length >= 2) {
      return NextResponse.json(
        { error: "You've already reflected today ✨ come back tomorrow.", remainingGenerations: 0 },
        { status: 429 }
      );
    }

    // ─── Step 2: EMOTION DETECTION (Feature #1) ─────────────────
    console.log('Running emotion detection...');
    const emotionResult = detectEmotion({ activities, mood, challenges, achievements });
    console.log('Detected:', emotionResult.emotion, '|', emotionResult.theme, '| conf:', emotionResult.confidence);

    // Check feedback-learned style preferences
    let feedbackOverrides: { preferred_style?: string; preferred_palette?: string } | undefined;
    try {
      const { data: prefs } = await supabaseAdmin
        .from('emotion_style_prefs')
        .select('preferred_style, preferred_palette, positive_count, negative_count')
        .eq('user_id', userId).eq('emotion', emotionResult.emotion).single();
      
      if (prefs && prefs.positive_count > prefs.negative_count) {
        feedbackOverrides = {
          preferred_style: prefs.preferred_style || undefined,
          preferred_palette: prefs.preferred_palette || undefined,
        };
        console.log('Applied feedback overrides:', feedbackOverrides);
      }
    } catch { /* no prefs yet */ }

    const styleModifiers = getStyleModifiers(
      emotionResult.emotion, emotionResult.theme, theme, feedbackOverrides
    );

    // ─── Step 3: Save response WITH emotion data ────────────────
    const { data: dailyResponse, error: responseError } = await supabaseAdmin
      .from("daily_responses")
      .insert({
        user_id: userId,
        response: userAnswers,
        detected_emotion: emotionResult.emotion,
        detected_theme: emotionResult.theme,
        emotion_confidence: emotionResult.confidence,
        emotion_metadata: {
          secondary: emotionResult.secondaryEmotion,
          emotionKeywords: emotionResult.emotionKeywords,
          themeKeywords: emotionResult.themeKeywords,
        },
      })
      .select("id").single();

    if (responseError || !dailyResponse) {
      console.error("Error saving daily response:", responseError);
      return NextResponse.json({ error: "Failed to save reflection" }, { status: 500 });
    }

    const responseId = dailyResponse.id;

    // ─── Step 4: Emotion-aware prompt generation (Gemini) ───────
    const geminiStart = Date.now();
    const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
    
    if (!GOOGLE_AI_API_KEY) {
      return NextResponse.json({ error: "AI service not configured." }, { status: 503 });
    }
    
    const systemPrompt = `You are an AI Reflection Agent that transforms daily reflections into stunning visual art.
You are EMOTION-AWARE. Detected emotion: "${emotionResult.emotion}" (confidence: ${emotionResult.confidence}), theme: "${emotionResult.theme}".
${emotionResult.secondaryEmotion ? `Secondary emotion: "${emotionResult.secondaryEmotion}".` : ''}

EMOTION-STYLE DIRECTIVES:
- Colors: ${styleModifiers.colorPalette}
- Mood: ${styleModifiers.moodDescriptor}
- Lighting: ${styleModifiers.lightingStyle}
- Atmosphere: ${styleModifiers.atmosphereNote}

Return ONLY a JSON object:
{
  "prompt": "3-5 sentence visual scene that MUST reflect ${emotionResult.emotion} emotion with ${styleModifiers.colorPalette} colors",
  "generator": "Stable-Diffusion",
  "style": "anime" | "realistic" | "cyberpunk" | "minimalist" | "futuristic",
  "size": "2048x3620",
  "vibe": "2-4 word emotional summary"
}

RULES:
1. Entire scene must echo "${emotionResult.emotion}" — use ${styleModifiers.lightingStyle}, ${styleModifiers.atmosphereNote}
2. Extract context: studying→tech workspace, exercise→outdoors, cooking→kitchen
3. Theme: anime=original characters+dynamic poses, realistic=photorealistic, cyberpunk=neon+urban, minimalist=clean+negative space
4. Vertical 9:16, subject in lower 2/3, depth + layers
5. Include: "highly detailed", "cinematic", colors from palette
6. NEVER use copyrighted characters, celebrities, or violent content

Output ONLY the JSON.`;

    let responseText: string;
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GOOGLE_AI_API_KEY}`,
        { contents: [{ parts: [{ text: `${systemPrompt}\n\nUser reflection: ${JSON.stringify(userAnswers)}` }] }] },
        { headers: { 'Content-Type': 'application/json' }, timeout: 30000 }
      );
      responseText = response.data.candidates[0].content.parts[0].text;
    } catch (geminiError: any) {
      return NextResponse.json(
        { error: `AI service error: ${geminiError.message || 'Failed to generate prompt'}` },
        { status: 503 }
      );
    }

    // ─── Step 5: Parse response ─────────────────────────────────
    const geminiMs = Date.now() - geminiStart;
    let imagePromptData: ImagePrompt;

    try {
      const cleaned = responseText.replace(/```json\n?|\n?```/g, "").trim();
      imagePromptData = JSON.parse(cleaned);
    } catch {
      await logGeneration({ userId: userId!, generator: 'Gemini', timeMs: geminiMs, success: false, errorMessage: 'Parse failed', promptLength: 0 });
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }
    
    await logGeneration({
      userId: userId!, generator: 'Gemini', timeMs: geminiMs, success: true,
      promptLength: JSON.stringify(userAnswers).length,
      metadata: { vibe: imagePromptData.vibe, emotion: emotionResult.emotion, theme: emotionResult.theme },
    });

    // ─── Step 6: Content moderation ─────────────────────────────
    let finalPrompt: string;
    let wasPromptCleaned = false;
    
    try {
      const { cleanedPrompt, wasCleaned } = await validateAndCleanPrompt(imagePromptData.prompt);
      finalPrompt = cleanedPrompt;
      wasPromptCleaned = wasCleaned;
    } catch (moderationError: any) {
      return NextResponse.json(
        { error: moderationError.message || 'Content moderation failed.', type: 'moderation_error' },
        { status: 400 }
      );
    }

    // ─── Step 7: Refine prompt with emotion context ─────────────
    let refinedPrompt: string;
    try {
      const refResp = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GOOGLE_AI_API_KEY}`,
        { contents: [{ parts: [{ text: `Enhance this Stable Diffusion XL prompt for maximum quality.

EMOTION: ${emotionResult.emotion} | PALETTE: ${styleModifiers.colorPalette} | LIGHTING: ${styleModifiers.lightingStyle} | MOOD: ${styleModifiers.moodDescriptor}

Original: ${finalPrompt}

Keep 3-4 sentences. MUST use the specified palette and lighting. Add "highly detailed, professional, cinematic, 8k quality".
Output ONLY the enhanced prompt.` }] }] },
        { headers: { 'Content-Type': 'application/json' }, timeout: 30000 }
      );
      refinedPrompt = refResp.data.candidates[0].content.parts[0].text.trim();
    } catch {
      refinedPrompt = finalPrompt;
    }

    // ─── Step 8: Generate image ─────────────────────────────────
    const imgStart = Date.now();
    const imageUrl = await generateWithStableDiffusion(refinedPrompt);
    const imgMs = Date.now() - imgStart;

    // ─── Step 9: Upload ─────────────────────────────────────────
    const uploadedImageUrl = await uploadToSupabase(imageUrl, responseId);

    // ─── Step 10: Save image with emotion metadata ──────────────
    const { data: imageRecord, error: imageError } = await supabaseAdmin
      .from("generated_images")
      .insert({
        user_id: userId, response_id: responseId,
        image_url: uploadedImageUrl, prompt_used: refinedPrompt,
        raw_prompt: imagePromptData.prompt,
        generator: imagePromptData.generator, vibe: imagePromptData.vibe,
        emotion: emotionResult.emotion, theme: emotionResult.theme,
        style_modifiers: {
          palette: styleModifiers.colorPalette,
          mood: styleModifiers.moodDescriptor,
          lighting: styleModifiers.lightingStyle,
          atmosphere: styleModifiers.atmosphereNote,
          feedbackApplied: !!feedbackOverrides,
        },
      })
      .select("id").single();

    await logGeneration({
      userId: userId!, generator: 'Stable-Diffusion', timeMs: imgMs,
      success: !imageError, promptLength: refinedPrompt.length,
      errorMessage: imageError?.message,
      metadata: { vibe: imagePromptData.vibe, emotion: emotionResult.emotion, theme: emotionResult.theme },
    });

    // ─── Step 11: Generate & store explanation (Feature #2) ─────
    let explanationData;
    try {
      const explanation = generateExplanation({
        userInput: userAnswers,
        emotion: emotionResult.emotion,
        emotionConfidence: emotionResult.confidence,
        secondaryEmotion: emotionResult.secondaryEmotion,
        theme: emotionResult.theme,
        emotionKeywords: emotionResult.emotionKeywords,
        themeKeywords: emotionResult.themeKeywords,
        finalPrompt: refinedPrompt,
        style: imagePromptData.style,
      });
      explanationData = explanationToJson(explanation);

      if (imageRecord) {
        await supabaseAdmin.from("image_explanations").insert({
          user_id: userId, image_id: imageRecord.id,
          response_id: responseId, explanation: explanationData,
        });
      }
    } catch (e) {
      console.error('Explanation error:', e);
    }

    // ─── Step 12: Return enriched result ────────────────────────
    return NextResponse.json({
      imageUrl: uploadedImageUrl,
      vibe: imagePromptData.vibe,
      emotion: emotionResult.emotion,
      emotionConfidence: emotionResult.confidence,
      theme: emotionResult.theme,
      secondaryEmotion: emotionResult.secondaryEmotion || null,
      imageId: imageRecord?.id || null,
      responseId,
      explanation: explanationData || null,
    });

  } catch (error) {
    console.error("Error processing submission:", error);
    
    if (typeof userId !== 'undefined') {
      try {
        await logGeneration({
          userId, generator: 'Gemini', timeMs: 0, success: false,
          errorMessage: error instanceof Error ? error.message : 'Unknown error', promptLength: 0,
        });
      } catch { /* ignore telemetry errors */ }
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

// ─── Stable Diffusion Integration ─────────────────────────────

async function generateWithStableDiffusion(prompt: string): Promise<string> {
  const HF_API_KEY = process.env.HUGGINGFACE_API_KEY || "";
  if (!HF_API_KEY) throw new Error("HUGGINGFACE_API_KEY not configured");
  
  console.log('Calling Stable Diffusion...');
  
  const response = await axios.post(
    "https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0",
    { inputs: prompt },
    {
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        "Content-Type": "application/json",
        "Accept": "image/png",
      },
      responseType: "arraybuffer",
      timeout: 60000,
    }
  );

  const base64Image = Buffer.from(response.data).toString("base64");
  return `data:image/png;base64,${base64Image}`;
}

// ─── Supabase Storage Upload ──────────────────────────────────

async function uploadToSupabase(imageUrl: string, responseId: string): Promise<string> {
  if (!supabaseAdmin) throw new Error("Supabase not configured");

  let base64Data: string;
  if (imageUrl.startsWith("data:image")) {
    base64Data = imageUrl.split(",")[1];
  } else {
    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
    base64Data = Buffer.from(response.data).toString("base64");
  }

  const fileName = `img-${Date.now()}.png`;
  const { data, error } = await supabaseAdmin.storage
    .from("generated")
    .upload(fileName, Buffer.from(base64Data, "base64"), { contentType: "image/png" });

  if (error) throw error;

  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/generated/${data.path}`;
}
