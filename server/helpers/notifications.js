const nodemailer = require("nodemailer");

function readEnv(name) {
  const value = process.env[name];
  return typeof value === "string" ? value.trim() : "";
}

const twilioSid = readEnv("TWILIO_ACCOUNT_SID");
const twilioToken = readEnv("TWILIO_AUTH_TOKEN");
const twilioFrom = readEnv("TWILIO_WHATSAPP_FROM");
const adminEmail = readEnv("ADMIN_EMAIL");
const adminWhatsapp = readEnv("ADMIN_WHATSAPP_TO");

function createTransporter() {
  const host = readEnv("SMTP_HOST");
  const port = Number(readEnv("SMTP_PORT") || 587);
  const user = readEnv("SMTP_USER");
  const pass = readEnv("SMTP_PASS");
  const secure = readEnv("SMTP_SECURE") === "true";

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

function isSmtpAuthError(error) {
  return error?.code === "EAUTH" || error?.responseCode === 535;
}

async function sendEmail({ to, subject, text }) {
  const transporter = createTransporter();

  if (!transporter || !to) {
    return { skipped: true };
  }

  try {
    await transporter.sendMail({
      from: readEnv("EMAIL_FROM") || readEnv("SMTP_FROM") || readEnv("SMTP_USER"),
      to,
      subject,
      text,
    });
  } catch (error) {
    if (isSmtpAuthError(error)) {
      console.log(
        "Support email skipped. SMTP authentication failed. Check SMTP_USER and SMTP_PASS for your mail provider."
      );
      return { skipped: true, reason: "smtp-auth-failed" };
    }

    console.log(`Support email skipped. ${error.message}`);
    return { skipped: true, reason: "smtp-send-failed" };
  }

  return { skipped: false };
}

async function sendWhatsapp({ to, body }) {
  if (!twilioSid || !twilioToken || !twilioFrom || !to) {
    return { skipped: true };
  }

  const authHeader = Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64");
  const params = new URLSearchParams({
    From: twilioFrom,
    To: to,
    Body: body,
  });

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${authHeader}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Twilio error: ${errorText}`);
  }

  return { skipped: false };
}

async function sendTicketCreatedNotifications({ user, ticket, order }) {
  const ticketText = `Your ${ticket.type} request for order ${order._id} has been received and is now pending review.`;
  const adminText = `New ${ticket.type} support ticket from ${user.userName} for order ${order._id}.`;

  await Promise.allSettled([
    sendEmail({
      to: user.email,
      subject: "Support request received",
      text: ticketText,
    }),
    sendEmail({
      to: adminEmail,
      subject: "New support ticket created",
      text: adminText,
    }),
    sendWhatsapp({
      to: user.phone || user.whatsappNumber || readEnv("DEFAULT_USER_WHATSAPP_TO"),
      body: ticketText,
    }),
    sendWhatsapp({
      to: adminWhatsapp,
      body: adminText,
    }),
  ]);
}

async function sendTicketStatusNotifications({ user, ticket, order }) {
  const text = `Your ${ticket.type} request for order ${order._id} has been ${ticket.status}. ${ticket.adminResponse || ""}`.trim();

  await Promise.allSettled([
    sendEmail({
      to: user.email,
      subject: `Support request ${ticket.status}`,
      text,
    }),
    sendWhatsapp({
      to: user.phone || user.whatsappNumber || readEnv("DEFAULT_USER_WHATSAPP_TO"),
      body: text,
    }),
  ]);
}

module.exports = {
  sendTicketCreatedNotifications,
  sendTicketStatusNotifications,
};
