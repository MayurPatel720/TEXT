import nodemailer from 'nodemailer';

// ============================================================================
// Email Service Configuration
// ============================================================================

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ============================================================================
// Email Templates
// ============================================================================

const emailTemplates = {
  passwordReset: (resetLink: string) => ({
    subject: 'Reset Your Password - Textile AI',
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
  }),

  welcome: (name: string, loginLink: string) => ({
    subject: 'Welcome to Textile AI! 🎨',
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
                <tr>
                  <td style="padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.1);">
                    <h1 style="margin: 0; color: #0066FF; font-size: 24px; font-weight: 700;">Textile AI</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 32px;">
                    <h2 style="margin: 0 0 16px; color: #ffffff; font-size: 20px; font-weight: 600;">Welcome, ${name}! 🎉</h2>
                    <p style="margin: 0 0 24px; color: rgba(255,255,255,0.7); font-size: 14px; line-height: 1.6;">
                      Your account has been created. You now have 5 free credits to start generating amazing textile designs.
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 8px 0 24px;">
                          <a href="${loginLink}" style="display: inline-block; background: linear-gradient(135deg, #0066FF 0%, #0052cc 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-size: 14px; font-weight: 600;">
                            Start Creating
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
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
    text: `Welcome to Textile AI, ${name}!\n\nYour account has been created. You now have 5 free credits to start generating amazing textile designs.\n\nStart creating: ${loginLink}\n\n© ${new Date().getFullYear()} Textile AI`
  })
};

// ============================================================================
// Email Service Class
// ============================================================================

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private config: EmailConfig | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    const emailHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
    const emailPort = parseInt(process.env.EMAIL_PORT || '587', 10);

    if (emailUser && emailPass) {
      this.config = {
        host: emailHost,
        port: emailPort,
        secure: emailPort === 465,
        auth: {
          user: emailUser,
          pass: emailPass,
        },
      };
      this.isConfigured = true;
    }
  }

  private getTransporter(): nodemailer.Transporter {
    if (!this.transporter && this.config) {
      this.transporter = nodemailer.createTransport(this.config);
    }
    return this.transporter!;
  }

  /**
   * Send an email with retry logic
   * @param options - Email options (to, subject, html, text)
   * @param maxRetries - Maximum retry attempts (default: 3)
   * @returns Promise<SendEmailResult>
   */
  async sendEmail(options: EmailOptions, maxRetries = 3): Promise<SendEmailResult> {
    if (!this.isConfigured) {
      console.log('📧 Email not configured. Would have sent:');
      console.log(`   To: ${options.to}`);
      console.log(`   Subject: ${options.subject}`);
      return { 
        success: false, 
        error: 'Email service not configured' 
      };
    }

    const fromName = process.env.EMAIL_FROM_NAME || 'Textile AI';
    const fromEmail = this.config!.auth.user;

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.getTransporter().sendMail({
          from: `"${fromName}" <${fromEmail}>`,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text,
        });

        console.log(`✅ Email sent successfully to: ${options.to}`);
        return { 
          success: true, 
          messageId: result.messageId 
        };
      } catch (error) {
        lastError = error as Error;
        console.error(`❌ Email send attempt ${attempt}/${maxRetries} failed:`, lastError.message);

        if (attempt < maxRetries) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, attempt - 1) * 1000;
          console.log(`⏳ Retrying in ${delay / 1000}s...`);
          await this.sleep(delay);
        }
      }
    }

    console.error(`❌ All ${maxRetries} email send attempts failed`);
    return { 
      success: false, 
      error: lastError?.message || 'Failed to send email after retries' 
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(to: string, resetLink: string): Promise<SendEmailResult> {
    const template = emailTemplates.passwordReset(resetLink);
    
    // Always log in development for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('\n========================================');
      console.log('🔑 PASSWORD RESET LINK (dev):');
      console.log(resetLink);
      console.log('========================================\n');
    }

    return this.sendEmail({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  /**
   * Send welcome email to new users
   */
  async sendWelcomeEmail(to: string, name: string): Promise<SendEmailResult> {
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const loginLink = `${baseUrl}/login`;
    const template = emailTemplates.welcome(name, loginLink);

    return this.sendEmail({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  /**
   * Check if email service is configured
   */
  isEmailConfigured(): boolean {
    return this.isConfigured;
  }
}

// Export singleton instance
export const emailService = new EmailService();

// Export for testing
export { EmailService, emailTemplates };
export type { EmailOptions, SendEmailResult };
