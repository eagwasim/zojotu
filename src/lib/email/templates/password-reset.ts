export function passwordResetEmail(resetUrl: string, displayName: string) {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a1a1a;">Reset Your Password</h2>
      <p style="color: #4a4a4a;">Hi ${displayName},</p>
      <p style="color: #4a4a4a;">
        We received a request to reset your password. Click the button below to create a new password.
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
          Reset Password
        </a>
      </div>
      <p style="color: #6a6a6a; font-size: 14px;">
        This link will expire in 1 hour. If you didn't request a password reset, you can ignore this email.
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
      <p style="color: #9a9a9a; font-size: 12px;">Zojotu Watch Services</p>
    </div>
  `;

  const text = `Hi ${displayName},\n\nReset your password by visiting: ${resetUrl}\n\nThis link expires in 1 hour.\n\nZojotu Watch Services`;

  return { html, text };
}
