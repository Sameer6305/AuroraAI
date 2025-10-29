import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { validateAndCleanPrompt } from "@/lib/content-moderation";
import { logGeneration, calculateCost } from "@/lib/telemetry";

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
    
    console.log('Received submission:', { ...userAnswers, activities: userAnswers.activities?.substring(0, 50) + '...' });
    
    // Validate required fields
    const { activities, mood, challenges, achievements, theme } = userAnswers;
    
    if (!activities || !mood || !challenges || !achievements || !theme) {
      console.error('Missing fields:', { activities: !!activities, mood: !!mood, challenges: !!challenges, achievements: !!achievements, theme: !!theme });
      return NextResponse.json(
        { error: "Missing required fields: activities, mood, challenges, achievements, theme" },
        { status: 400 }
      );
    }

    // Check if Supabase is configured
    if (!supabaseAdmin) {
      console.error('Supabase not configured!');
      return NextResponse.json(
        { error: "Database not configured. Please set SUPABASE environment variables." },
        { status: 503 }
      );
    }

    // Step 1: Get authenticated user from Supabase Auth or use anonymous ID
    const authHeader = request.headers.get('authorization');
    
    if (authHeader) {
      // Try to get authenticated user
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
      
      if (user && !authError) {
        userId = user.id;
        console.log('Authenticated user:', userId);
      } else {
        console.log('Auth token invalid, creating anonymous user');
        // Create anonymous user in database
        const { data: anonUser, error: anonError } = await supabaseAdmin
          .from("users")
          .insert({ email: `anon-${crypto.randomUUID()}@temp.local` })
          .select("id")
          .single();
        
        if (anonError || !anonUser) {
          console.error("Error creating anonymous user:", anonError);
          throw new Error("Failed to create user session");
        }
        userId = anonUser.id;
        console.log('Created anonymous user:', userId);
      }
    } else if (userAnswers.email) {
      // Legacy: Find or create user by email
      const { data: existingUser } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("email", userAnswers.email)
        .single();

      if (existingUser) {
        userId = existingUser.id;
        console.log('Found existing user by email:', userId);
      } else {
        const { data: newUser, error: userError } = await supabaseAdmin
          .from("users")
          .insert({ email: userAnswers.email })
          .select("id")
          .single();

        if (userError || !newUser) {
          console.error("Error creating user:", userError);
          throw new Error("Failed to create user account");
        } else {
          userId = newUser.id;
          console.log('Created new user:', userId);
        }
      }
    } else {
      // Anonymous user - create in database
      console.log('Creating anonymous user in database...');
      const { data: anonUser, error: anonError } = await supabaseAdmin
        .from("users")
        .insert({ email: `anon-${crypto.randomUUID()}@temp.local` })
        .select("id")
        .single();
      
      if (anonError || !anonUser) {
        console.error("Error creating anonymous user:", anonError);
        throw new Error("Failed to create user session");
      }
      userId = anonUser.id;
      console.log('Anonymous user created:', userId);
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

    // Step 3: Send to Gemini with system prompt
    const claudeStartTime = Date.now();
    
    // Validate Google AI API Key
    if (!process.env.GOOGLE_AI_API_KEY) {
      console.error('GOOGLE_AI_API_KEY not set!');
      return NextResponse.json(
        { error: "AI service not configured. Please set GOOGLE_AI_API_KEY." },
        { status: 503 }
      );
    }
    
    const systemPrompt = `You are an AI Reflection Agent that transforms daily reflections into stunning visual art concepts.

Analyze the user's activities, mood, challenges, and achievements to create a deeply personalized image that captures their day's essence.

Return ONLY a JSON object (no markdown, no explanation):

{
  "prompt": "Detailed visual scene description (3-5 sentences, cinematic, emotional, highly specific)",
  "generator": "Stable-Diffusion",
  "style": "anime" | "realistic" | "cyberpunk" | "minimalist" | "futuristic",
  "size": "2048x3620",
  "vibe": "2-4 word emotional summary"
}

CRITICAL RULES FOR GENERATING PROMPTS:

1. **Extract Context from User Data:**
   - If they mention studying/engineering/coding → show tech workspace, books, computers, focused environment
   - If they mention exercise/jogging → include fitness elements, outdoor scenes, active poses
   - If they mention cooking → kitchen scenes, food preparation, warm lighting
   - If they mention team/friends → group settings, collaborative spaces
   - If they mention nature/walks → outdoor scenery, natural elements
   - Match time of day (morning/evening) to lighting in the scene

2. **Mood Translation:**
   - "tired but satisfied" → peaceful evening scene, accomplishment atmosphere
   - "overwhelmed" → dynamic, busy background with calming foreground
   - "motivated" → energetic, forward-looking composition with bright lighting
   - "calm" → serene, minimalist, soft colors and gentle lighting

3. **Theme Adaptations:**
   - **anime/naruto**: Create ORIGINAL characters in anime style (never use copyrighted characters), use dynamic poses, vibrant colors
   - **realistic**: Photorealistic environments matching activities, natural lighting, authentic details
   - **cyberpunk**: Neon lights, futuristic tech, urban nightscape, holographic elements
   - **minimalist**: Clean lines, limited color palette, negative space, simple geometric shapes
   - **futuristic**: Sci-fi elements, advanced technology, sleek design, innovative concepts

4. **Composition for 9:16 Mobile Wallpaper:**
   - Vertical orientation emphasis
   - Subject in lower 2/3 for status bar clearance
   - Depth and layers for visual interest
   - Strong focal point with atmospheric background

5. **Quality Keywords to Include:**
   - Lighting: "golden hour", "soft ambient light", "dramatic shadows", "ethereal glow"
   - Detail: "highly detailed", "intricate", "professional photography", "cinematic"
   - Mood: specific emotional descriptors that match user's feelings
   - Environment: specific locations relevant to their activities

6. **Avoid:**
   - Generic descriptions
   - Copyright characters or celebrities
   - Violent or inappropriate content
   - Vague or abstract concepts without grounding

Example: If user studied engineering and felt accomplished:
"A cozy study corner bathed in warm evening light, scattered engineering textbooks and a glowing laptop displaying circuit diagrams, coffee mug steaming beside handwritten notes, through the window a peaceful sunset cityscape, atmosphere of quiet satisfaction and intellectual achievement, highly detailed, cinematic depth of field"

Output ONLY the JSON object.`;

    // Use Gemini via REST API (correct v1beta endpoint)
    console.log('Calling Gemini to generate image prompt...');
    const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
    
    if (!GOOGLE_AI_API_KEY) {
      console.error('GOOGLE_AI_API_KEY not set!');
      return NextResponse.json(
        { error: "AI service not configured. Please set GOOGLE_AI_API_KEY." },
        { status: 503 }
      );
    }
    
    let result;
    let responseText: string;
    try {
      // Try gemini-2.5-flash-lite first (lighter load), fallback to main model
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GOOGLE_AI_API_KEY}`,
        {
          contents: [{
            parts: [{
              text: `${systemPrompt}\n\nUser reflection: ${JSON.stringify(userAnswers)}`
            }]
          }]
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000
        }
      );
      
      responseText = response.data.candidates[0].content.parts[0].text;
      console.log('Gemini response received, length:', responseText.length);
    } catch (geminiError: any) {
      console.error('Gemini API error:', geminiError);
      console.error('Error response:', geminiError.response?.data);
      return NextResponse.json(
        { error: `AI service error: ${geminiError.message || 'Failed to generate prompt'}` },
        { status: 503 }
      );
    }

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

    // Step 4.6: Refine prompt for cinematic quality with Stable Diffusion optimization
    let refinedPrompt: string;
    try {
      const refinementResponse = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GOOGLE_AI_API_KEY}`,
        {
          contents: [{
            parts: [{
              text: `Enhance this Stable Diffusion XL prompt for maximum visual quality and emotional impact:

Original: ${finalPrompt}

Add these elements while keeping it concise (3-4 sentences max):
- Specific lighting details (time of day, light quality, shadows)
- Camera perspective and depth of field
- Texture and material details
- Atmospheric effects and mood enhancement
- Color palette specifics
- Quality tags: "highly detailed", "professional", "cinematic composition", "8k quality"

Keep the core concept but make it more visually specific and emotionally resonant.
Output ONLY the enhanced prompt, no explanation.`
            }]
          }]
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000
        }
      );
      refinedPrompt = refinementResponse.data.candidates[0].content.parts[0].text.trim();
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
    console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');
    
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
      { error: error instanceof Error ? error.message : "Internal server error" },
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
    
    if (!HF_API_KEY) {
      throw new Error("HUGGINGFACE_API_KEY not configured");
    }
    
    console.log('Calling Stable Diffusion API...');
    console.log('Prompt:', prompt.substring(0, 100) + '...');
    
    // Use Stable Diffusion XL (free on Hugging Face)
    // Updated to new Inference Providers endpoint (Nov 2025)
    const response = await axios.post(
      "https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0",
      { inputs: prompt },
      {
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json",
          "Accept": "image/png", // Required by new endpoint
        },
        responseType: "arraybuffer",
        timeout: 60000, // 60 second timeout
      }
    );

    console.log('Stable Diffusion response received, size:', response.data.length);

    // Convert to base64
    const base64Image = Buffer.from(response.data).toString("base64");
    return `data:image/png;base64,${base64Image}`;

  } catch (error: any) {
    console.error("Error generating with Stable Diffusion:", error.message);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data?.toString());
    }
    throw new Error(`Failed to generate image: ${error.message}`);
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
