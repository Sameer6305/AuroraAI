import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { validateAndCleanPrompt } from "@/lib/content-moderation";
import { logGeneration, calculateCost } from "@/lib/telemetry";

// Initialize Google Generative AI client (FREE - Gemini 1.5 Flash)
const genai = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");

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
  generator: "Stable-Diffusion"; // Only free option now
  style: string;
  size: string;
  vibe: string;
}

export async function POST(request: NextRequest) {
  let userId: string | undefined;
  
  try {
    const userAnswers: UserAnswers = await request.json();
    
    // Validate required fields
    const { activities, mood, challenges, achievements, theme } = userAnswers;
    
    if (!activities || !mood || !challenges || !achievements || !theme) {
      return NextResponse.json(
        { error: "Missing required fields: activities, mood, challenges, achievements, theme" },
        { status: 400 }
      );
    }

    // Check if Supabase is configured
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database not configured. Please set SUPABASE environment variables." },
        { status: 503 }
      );
    }

    // Step 1: Find or create user
    if (userAnswers.email) {
      const { data: existingUser } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("email", userAnswers.email)
        .single();

      if (existingUser) {
        userId = existingUser.id;
      } else {
        const { data: newUser, error: userError } = await supabaseAdmin
          .from("users")
          .insert({ email: userAnswers.email })
          .select("id")
          .single();

        if (userError || !newUser) {
          console.error("Error creating user:", userError);
          userId = crypto.randomUUID();
        } else {
          userId = newUser.id;
        }
      }
    } else {
      userId = crypto.randomUUID();
    }

    // Step 1.5: Check daily generation limit (2 per day)
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const { data: todayResponses, error: countError } = await supabaseAdmin
      .from("daily_responses")
      .select("id")
      .eq("user_id", userId)
      .gte("created_at", todayStart.toISOString())
      .lte("created_at", todayEnd.toISOString());

    if (countError) {
      console.error("Error checking daily limit:", countError);
    }

    // Check if user has already generated 2 reflections today
    if (todayResponses && todayResponses.length >= 2) {
      return NextResponse.json(
        { 
          error: "You've already reflected today ✨ come back tomorrow.",
          remainingGenerations: 0,
          nextAvailableAt: new Date(todayEnd.getTime() + 1000).toISOString()
        },
        { status: 429 }
      );
    }

    // Step 2: Save to daily_responses table
    const { data: dailyResponse, error: responseError } = await supabaseAdmin
      .from("daily_responses")
      .insert({
        user_id: userId,
        response: userAnswers,
      })
      .select("id")
      .single();

    if (responseError || !dailyResponse) {
      console.error("Error saving daily response:", responseError);
      return NextResponse.json(
        { error: "Failed to save reflection" },
        { status: 500 }
      );
    }

    const responseId = dailyResponse.id;

    // Step 3: Send to Claude Sonnet 4.5 with system prompt
    const claudeStartTime = Date.now();
    const systemPrompt = `You are an AI Reflection Agent that turns a user's daily reflection into an image concept.

Use the input JSON to understand their mood, activities, and vibe of yesterday.
Return only a JSON object:

{
  "prompt": "Detailed image description (2–4 cinematic sentences, emotional, 9:16 wallpaper)",
  "generator": "Imagen-3" or "Midjourney",
  "style": "anime" | "realistic" | "cyberpunk" | "minimalist",
  "size": "2048x3620",
  "vibe": "short summary like 'hopeful and calm'"
}

Rules:
- Use Stable Diffusion for all images (it's free and versatile).
- For anime themes, consider Naruto or One Piece style elements.
- Create original characters (no copyrighted likeness).
- Include lighting, emotion, setting, and colors.
Output ONLY JSON, no markdown, no explanation.`;

    // Use Gemini 1.5 Flash (FREE) instead of Claude
    const model = genai.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(
      `${systemPrompt}\n\nUser reflection: ${JSON.stringify(userAnswers)}`
    );
    const responseText = result.response.text();

    // Step 4: Parse Gemini's response
    const claudeEndTime = Date.now();
    const claudeTimeMs = claudeEndTime - claudeStartTime;
    
    let imagePromptData: ImagePrompt;

    try {
      // Remove markdown code blocks if present
      const cleanedResponse = responseText.replace(/```json\n?|\n?```/g, "").trim();
      imagePromptData = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error("Error parsing Gemini response:", parseError);
      console.log("Raw response:", responseText);
      
      // Log Gemini failure
      await logGeneration({
        userId: userId!,
        generator: 'Gemini',
        timeMs: claudeTimeMs,
        success: false,
        errorMessage: 'Failed to parse Gemini response',
        promptLength: JSON.stringify(userAnswers).length,
      });
      
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }
    
    // Log successful Gemini generation
    await logGeneration({
      userId: userId!,
      generator: 'Gemini',
      timeMs: claudeTimeMs,
      success: true,
      promptLength: JSON.stringify(userAnswers).length,
      metadata: {
        generatedVibe: imagePromptData.vibe,
        generatorSelected: imagePromptData.generator,
      },
    });

    // Step 4.5: Validate and clean the prompt for safety
    let finalPrompt: string;
    let wasPromptCleaned = false;
    
    try {
      const { cleanedPrompt, wasCleaned, originalPrompt } = await validateAndCleanPrompt(
        imagePromptData.prompt
      );
      
      finalPrompt = cleanedPrompt;
      wasPromptCleaned = wasCleaned;
      
      if (wasCleaned) {
        console.log('Prompt was cleaned for safety');
        console.log('Original:', originalPrompt);
        console.log('Cleaned:', cleanedPrompt);
      }
    } catch (moderationError: any) {
      console.error('Content moderation error:', moderationError);
      return NextResponse.json(
        { 
          error: moderationError.message || 'Content moderation failed. Please revise your reflection.',
          type: 'moderation_error'
        },
        { status: 400 }
      );
    }

    // Step 4.6: Refine prompt for cinematic quality
    let refinedPrompt: string;
    try {
      const refinementModel = genai.getGenerativeModel({ model: "gemini-1.5-flash" });
      const refinementResult = await refinementModel.generateContent(
        `Refine this image prompt for higher cinematic detail and emotional tone, max 3 sentences, 9:16 mobile wallpaper:
${finalPrompt}
Output only refined prompt.`
      );
      refinedPrompt = refinementResult.response.text().trim();
      console.log('Prompt refined for quality');
      console.log('Original:', finalPrompt);
      console.log('Refined:', refinedPrompt);
    } catch (refinementError) {
      console.error('Prompt refinement failed, using original:', refinementError);
      refinedPrompt = finalPrompt; // Fallback to cleaned prompt
    }

    // Step 5-6: Generate image with FREE Stable Diffusion (using refined prompt)
    let imageUrl: string;
    const imageGenStartTime = Date.now();

    imageUrl = await generateWithStableDiffusion(refinedPrompt);
    
    const imageGenEndTime = Date.now();
    const imageGenTimeMs = imageGenEndTime - imageGenStartTime;

    // Step 7: Upload image to Supabase storage
    const uploadedImageUrl = await uploadToSupabase(imageUrl, responseId);

    // Step 8: Save to generated_images table
    const { error: imageError } = await supabaseAdmin
      .from("generated_images")
      .insert({
        user_id: userId,
        response_id: responseId,
        image_url: uploadedImageUrl,
        prompt_used: refinedPrompt, // Use the refined prompt
        generator: imagePromptData.generator,
        vibe: imagePromptData.vibe,
      });

    if (imageError) {
      console.error("Error saving generated image:", imageError);
      
      // Log image generation failure
      await logGeneration({
        userId: userId!,
        generator: 'Stable-Diffusion',
        timeMs: imageGenTimeMs,
        success: false,
        errorMessage: 'Failed to save generated image to database',
        promptLength: refinedPrompt.length,
        metadata: {
          vibe: imagePromptData.vibe,
          promptCleaned: wasPromptCleaned,
          promptRefined: refinedPrompt !== finalPrompt,
          originalPromptLength: finalPrompt.length,
        },
      });
    } else {
      // Log successful image generation
      await logGeneration({
        userId: userId!,
        generator: 'Stable-Diffusion',
        timeMs: imageGenTimeMs,
        success: true,
        promptLength: refinedPrompt.length,
        metadata: {
          vibe: imagePromptData.vibe,
          promptCleaned: wasPromptCleaned,
          promptRefined: refinedPrompt !== finalPrompt,
          originalPromptLength: finalPrompt.length,
          refinedPromptLength: refinedPrompt.length,
          uploadedUrl: uploadedImageUrl,
        },
      });
    }

    // Step 9: Return result
    return NextResponse.json({
      imageUrl: uploadedImageUrl,
      vibe: imagePromptData.vibe,
    });

  } catch (error) {
    console.error("Error processing submission:", error);
    
    // Try to log error to telemetry if userId is available
    if (typeof userId !== 'undefined') {
      try {
        await logGeneration({
          userId,
          generator: 'Gemini', // Default to Gemini as it's the first step
          timeMs: 0,
          success: false,
          errorMessage: error instanceof Error ? error.message : 'Unknown error occurred',
          promptLength: 0,
        });
      } catch (telemetryError) {
        console.error("Failed to log error to telemetry:", telemetryError);
      }
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Generate image using FREE Stable Diffusion via Hugging Face API
 */
async function generateWithStableDiffusion(prompt: string): Promise<string> {
  try {
    const HF_API_KEY = process.env.HUGGINGFACE_API_KEY || "";
    
    // Use Stable Diffusion XL (free on Hugging Face)
    const response = await axios.post(
      "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
      { inputs: prompt },
      {
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        responseType: "arraybuffer",
      }
    );

    // Convert to base64
    const base64Image = Buffer.from(response.data).toString("base64");
    return `data:image/png;base64,${base64Image}`;

  } catch (error) {
    console.error("Error generating with Stable Diffusion:", error);
    throw new Error("Failed to generate image with Stable Diffusion");
  }
}

/**
 * Upload image to Supabase storage
 */
async function uploadToSupabase(imageUrl: string, responseId: string): Promise<string> {
  if (!supabaseAdmin) {
    throw new Error("Supabase not configured");
  }

  try {
    let base64Data: string;

    // Handle base64 or URL
    if (imageUrl.startsWith("data:image")) {
      base64Data = imageUrl.split(",")[1];
    } else {
      const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
      base64Data = Buffer.from(response.data).toString("base64");
    }

    const fileName = `img-${Date.now()}.png`;

    const { data, error } = await supabaseAdmin.storage
      .from("generated")
      .upload(fileName, Buffer.from(base64Data, "base64"), {
        contentType: "image/png",
      });

    if (error) {
      console.error("Error uploading to Supabase:", error);
      throw error;
    }

    // Construct public URL
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/generated/${data.path}`;

    return publicUrl;

  } catch (error) {
    console.error("Error uploading to Supabase:", error);
    throw new Error("Failed to upload image");
  }
}
