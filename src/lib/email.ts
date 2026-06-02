import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPasswordResetEmail(email: string, token: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://sourdough.viosay.fun";
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;

  await resend.emails.send({
    from: "Sourdough <noreply@viosay.fun>",
    to: email,
    subject: "Сброс пароля — Sourdough",
    html: `
      <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #3d2c1e;">Сброс пароля</h2>
        <p style="color: #5a4a3a;">Кто-то запросил сброс пароля для вашего аккаунта в Sourdough.</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #c4956a; color: white; text-decoration: none; border-radius: 10px; font-weight: bold; margin: 16px 0;">
          Сбросить пароль
        </a>
        <p style="color: #8b7355; font-size: 14px;">Ссылка действительна 1 час.</p>
        <p style="color: #8b7355; font-size: 14px;">Если вы не запрашивали сброс — просто проигнорируйте это письмо.</p>
      </div>
    `,
  });
}
