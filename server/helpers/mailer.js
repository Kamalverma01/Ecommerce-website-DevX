const nodemailer = require("nodemailer");

function readEnv(name) {
  const value = process.env[name];
  return typeof value === "string" ? value.trim() : "";
}

const hasSmtpConfig =
  readEnv("SMTP_HOST") && readEnv("SMTP_PORT") && readEnv("SMTP_USER");

const transporter = hasSmtpConfig
  ? nodemailer.createTransport({
      host: readEnv("SMTP_HOST"),
      port: Number(readEnv("SMTP_PORT")),
      secure: readEnv("SMTP_SECURE") === "true",
      auth: {
        user: readEnv("SMTP_USER"),
        pass: readEnv("SMTP_PASS"),
      },
    })
  : null;

function isSmtpAuthError(error) {
  return error?.code === "EAUTH" || error?.responseCode === 535;
}

async function sendMail({ to, subject, text, html }) {
  if (!transporter) {
    console.log(`Email skipped. Configure SMTP_* env vars. To: ${to} | ${subject} | ${text}`);
    return { skipped: true };
  }

  try {
    return await transporter.sendMail({
      from: readEnv("SMTP_FROM") || readEnv("EMAIL_FROM") || readEnv("SMTP_USER"),
      to,
      subject,
      text,
      html,
    });
  } catch (error) {
    if (isSmtpAuthError(error)) {
      console.log(
        "Email skipped. SMTP authentication failed. Check SMTP_USER and SMTP_PASS for your mail provider."
      );
      return { skipped: true, reason: "smtp-auth-failed" };
    }

    console.log(`Email skipped. ${error.message}`);
    return { skipped: true, reason: "smtp-send-failed" };
  }
}

module.exports = { sendMail };
