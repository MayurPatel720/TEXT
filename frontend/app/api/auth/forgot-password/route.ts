import { NextResponse } from "next/server";
import crypto from "crypto";
import nodemailer from "nodemailer";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

// Store password reset tokens temporarily (also saved in DB)
const resetTokens = new Map<string, { email: string; expires: number }>();

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Connect to database and verify user exists
    await connectDB();
    const user = await User.findOne({ email: email.toLowerCase() });
    
    // If email is not registered, tell the user
    if (!user) {
      console.log('❌ Password reset requested for unregistered email:', email);
      return NextResponse.json(
        { error: "This email is not registered with us. Please check the email or create a new account." },
        { status: 404 }
      );
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = Date.now() + 3600000; // 1 hour

    // Store token in memory (for quick lookup) and in user document
    resetTokens.set(token, { email: email.toLowerCase(), expires });
    
    // Update user with reset token
    await User.updateOne(
      { email: email.toLowerCase() },
      { 
        resetPasswordToken: token,
        resetPasswordExpires: new Date(expires)
      }
    );

    // Build reset link
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const resetLink = `${baseUrl}/reset-password?token=${token}`;

    // Always log the reset link for debugging
    console.log('\n========================================');
    console.log('🔑 PASSWORD RESET LINK (for debugging):');
    console.log(resetLink);
    console.log('========================================\n');

    // Check if email is configured
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    const emailHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
    const emailPort = parseInt(process.env.EMAIL_PORT || '587');

    if (emailUser && emailPass) {
      // Send actual email
      const transporter = nodemailer.createTransport({
        host: emailHost,
        port: emailPort,
        secure: emailPort === 465,
        auth: {
          user: emailUser,
          pass: emailPass,
        },
      });

      const mailOptions = {
        from: `"Textile AI" <${emailUser}>`,
        to: email,
        subject: "Reset Your Password - Textile AI",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="100%" max-width="500" cellpadding="0" cellspacing="0" style="background-color: #111111; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
                    <!-- Header -->
                    <tr>
                      <td style="padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.1);">
                        <h1 style="margin: 0; color: #0066FF; font-size: 24px; font-weight: 700;">Textile AI</h1>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 32px;">
                        <h2 style="margin: 0 0 16px; color: #ffffff; font-size: 20px; font-weight: 600;">Reset Your Password</h2>
                        <p style="margin: 0 0 24px; color: rgba(255,255,255,0.7); font-size: 14px; line-height: 1.6;">
                          We received a request to reset your password. Click the button below to create a new password.
                        </p>
                        
                        <!-- Button -->
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="center" style="padding: 8px 0 24px;">
                              <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #0066FF 0%, #0052cc 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-size: 14px; font-weight: 600;">
                                Reset Password
                              </a>
                            </td>
                          </tr>
                        </table>
                        
                        <p style="margin: 0 0 16px; color: rgba(255,255,255,0.5); font-size: 12px; line-height: 1.6;">
                          This link will expire in 1 hour. If you didn't request this reset, you can safely ignore this email.
                        </p>
                        
                        <p style="margin: 0; color: rgba(255,255,255,0.4); font-size: 11px; word-break: break-all;">
                          If the button doesn't work, copy this link:<br>
                          <a href="${resetLink}" style="color: #0066FF;">${resetLink}</a>
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 24px 32px; text-align: center; border-top: 1px solid rgba(255,255,255,0.1);">
                        <p style="margin: 0; color: rgba(255,255,255,0.4); font-size: 11px;">
                          © ${new Date().getFullYear()} Textile AI. All rights reserved.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
        text: `Reset Your Password\n\nWe received a request to reset your password. Click the link below to create a new password:\n\n${resetLink}\n\nThis link will expire in 1 hour. If you didn't request this reset, you can safely ignore this email.\n\n© ${new Date().getFullYear()} Textile AI`
      };

      await transporter.sendMail(mailOptions);
      console.log("✅ Password reset email sent to:", email);

      return NextResponse.json({
        message: "Password reset link has been sent to your email."
      });
    } else {
      // Email not configured - return link for development
      console.log("⚠️ Email not configured. Reset link:", resetLink);
      
      return NextResponse.json({
        message: "Password reset link sent to your email",
        // Only show link in development when email is not configured
        ...(process.env.NODE_ENV === 'development' && { 
          devNote: "Email not configured - showing link for development only",
          resetLink 
        })
      });
    }
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Failed to process request. Please try again." },
      { status: 500 }
    );
  }
}
