import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import axios from "axios";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

// Initialize Google Generative AI client
const genai = new GoogleGenerativeAI(process.env.GEMINI_KEY || "");

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
  generator: "Imagen-3" | "Midjourney";
  style: string;
  size: string;
  vibe: string;
}

export async function POST(request: NextRequest) {
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
    let userId: string;
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
- Use Midjourney for anime/fantasy/cyberpunk; Imagen-3 for realistic/minimalist.
- For anime themes, consider Naruto or One Piece style elements.
- Create original characters (no copyrighted likeness).
- Include lighting, emotion, setting, and colors.
Output ONLY JSON, no markdown, no explanation.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `User reflection: ${JSON.stringify(userAnswers)}`,
        },
      ],
    });

    // Step 4: Parse Claude's response
    const responseText = message.content[0].type === "text" ? message.content[0].text : "";
    let imagePromptData: ImagePrompt;

    try {
      // Remove markdown code blocks if present
      const cleanedResponse = responseText.replace(/```json\n?|\n?```/g, "").trim();
      imagePromptData = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error("Error parsing Claude response:", parseError);
      console.log("Raw response:", responseText);
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    // Step 5-6: Generate image based on generator
    let imageUrl: string;

    if (imagePromptData.generator === "Imagen-3") {
      imageUrl = await generateWithImagen(imagePromptData.prompt);
    } else {
      imageUrl = await generateWithMidjourney(imagePromptData.prompt);
    }

    // Step 7: Upload image to Supabase storage
    const uploadedImageUrl = await uploadToSupabase(imageUrl, responseId);

    // Step 8: Save to generated_images table
    const { error: imageError } = await supabaseAdmin
      .from("generated_images")
      .insert({
        user_id: userId,
        response_id: responseId,
        image_url: uploadedImageUrl,
        prompt_used: imagePromptData.prompt,
        generator: imagePromptData.generator,
        vibe: imagePromptData.vibe,
      });

    if (imageError) {
      console.error("Error saving generated image:", imageError);
    }

    // Step 9: Return result
    return NextResponse.json({
      imageUrl: uploadedImageUrl,
      vibe: imagePromptData.vibe,
    });

  } catch (error) {
    console.error("Error processing submission:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Generate image using Google Imagen API
 */
async function generateWithImagen(prompt: string): Promise<string> {
  try {
    const model = genai.getGenerativeModel({ 
      model: "imagen-3.0-generate-001"
    });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        responseMimeType: "image/png",
      }
    });

    // Extract base64 image data from response
    const image = result.response;
    const base64Data = image.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (!base64Data) {
      throw new Error("No image data in response");
    }

    return `data:image/png;base64,${base64Data}`;

  } catch (error) {
    console.error("Error generating with Imagen:", error);
    throw new Error("Failed to generate image with Imagen");
  }
}

/**
 * Generate image using Midjourney API
 */
async function generateWithMidjourney(prompt: string): Promise<string> {
  try {
    // Add Midjourney parameters
    const midjourneyPrompt = `${prompt} --ar 9:16 --v 7 --q 2`;

    const response = await axios.post(
      `${process.env.MIDJOURNEY_API_URL}/imagine`,
      {
        prompt: midjourneyPrompt,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.MIDJOURNEY_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const taskId = response.data.taskId;

    // Poll for completion
    let imageUrl: string | null = null;
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max

    while (!imageUrl && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

      const statusResponse = await axios.get(
        `${process.env.MIDJOURNEY_API_URL}/task/${taskId}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.MIDJOURNEY_API_KEY}`,
          },
        }
      );

      if (statusResponse.data.status === "completed") {
        imageUrl = statusResponse.data.imageUrl;
      } else if (statusResponse.data.status === "failed") {
        throw new Error("Midjourney generation failed");
      }

      attempts++;
    }

    if (!imageUrl) {
      throw new Error("Midjourney generation timeout");
    }

    return imageUrl;

  } catch (error) {
    console.error("Error generating with Midjourney:", error);
    throw new Error("Failed to generate image with Midjourney");
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
