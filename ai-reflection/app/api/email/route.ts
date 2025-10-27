import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

// Initialize Resend with fallback to avoid build errors
const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function POST(request: NextRequest) {
  try {
    // Check if Resend is configured
    if (!resend) {
      return NextResponse.json(
        { error: "Email service not configured. Please set RESEND_API_KEY." },
        { status: 503 }
      );
    }

    const { email, imageUrl, vibe } = await request.json();

    // Validate required fields
    if (!email || !imageUrl || !vibe) {
      return NextResponse.json(
        { error: "Missing required fields: email, imageUrl, vibe" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: "AuroraAI <noreply@yourdomain.com>", // Update with your verified domain
      to: email,
      subject: "Your daily reflection image is ready 🌙",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f9fafb;
              }
              .container {
                background-color: #ffffff;
                border-radius: 12px;
                padding: 40px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              }
              h1 {
                color: #0e0e0e;
                font-size: 28px;
                margin-bottom: 16px;
                text-align: center;
              }
              .vibe {
                font-size: 18px;
                color: #00ffff;
                text-align: center;
                margin-bottom: 30px;
                font-weight: 500;
              }
              .image-container {
                text-align: center;
                margin: 30px 0;
              }
              img {
                max-width: 100%;
                height: auto;
                border-radius: 8px;
                box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
              }
              .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                color: #6b7280;
                font-size: 14px;
              }
              .footer a {
                color: #00ffff;
                text-decoration: none;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Your Daily Reflection is Ready! 🌙</h1>
              <p class="vibe">${vibe}</p>
              
              <div class="image-container">
                <img src="${imageUrl}" alt="Your reflection wallpaper" />
              </div>
              
              <p style="text-align: center; color: #6b7280; margin-top: 20px;">
                This personalized wallpaper was created based on your daily reflection. 
                Save it to your device and use it as a reminder of your journey.
              </p>
              
              <div class="footer">
                <p>Thank you for using <strong>AuroraAI</strong> 💫</p>
                <p>Keep reflecting, keep growing.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error("Error sending email:", error);
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      messageId: data?.id 
    });

  } catch (error) {
    console.error("Error in email API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
