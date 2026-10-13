// Sends transactional email through Brevo's HTTP API (not SMTP, because many
// free hosts block SMTP ports). Needs Node 18+ for the built-in fetch.
const { isProd, BREVO_API_KEY, MAIL_FROM_EMAIL, MAIL_FROM_NAME } = require("../config/env");

const BREVO_URL = "https://api.brevo.com/v3/smtp/email";

function otpEmailContent(otp) {
  const text =
    `Your ${MAIL_FROM_NAME} verification code is ${otp}.\n` +
    `It expires in 10 minutes. If you did not sign up, ignore this email.\n` +
    `Can't find our emails? Check your spam folder.`;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:420px;margin:auto;padding:24px">
      <h2 style="margin:0 0 12px">Verify your email</h2>
      <p>Use this code to finish creating your ${MAIL_FROM_NAME} account:</p>
      <p style="font-size:32px;letter-spacing:8px;font-weight:bold;margin:16px 0">${otp}</p>
      <p>It expires in 10 minutes. If you didn't sign up, you can ignore this email.</p>
      <p style="color:#666;font-size:12px">Tip: if emails from us land in spam, mark this one as "Not spam".</p>
    </div>`;

  return { text, html };
}

async function sendOtpEmail(to, otp) {
  if (!BREVO_API_KEY) {
    console.warn(`[OTP NOTICE] BREVO_API_KEY not configured. Verification code for ${to}: ${otp}`);
    return;
  }

  const { text, html } = otpEmailContent(otp);
  const res = await fetch(BREVO_URL, {
    method: "POST",
    headers: { "api-key": BREVO_API_KEY, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      sender: { name: MAIL_FROM_NAME, email: MAIL_FROM_EMAIL },
      to: [{ email: to }],
      subject: `${otp} is your ${MAIL_FROM_NAME} verification code`,
      htmlContent: html,
      textContent: text,
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Brevo responded ${res.status}: ${detail.slice(0, 200)}`);
  }
}

module.exports = { sendOtpEmail };
