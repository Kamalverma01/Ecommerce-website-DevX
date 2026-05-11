function readEnv(name) {
  const value = process.env[name];
  return typeof value === "string" ? value.trim() : "";
}

function twilioAuthHeader() {
  const sid = readEnv("TWILIO_ACCOUNT_SID");
  const token = readEnv("TWILIO_AUTH_TOKEN");

  if (!sid || !token) {
    return "";
  }

  if (!sid.startsWith("AC")) {
    throw new Error("TWILIO_ACCOUNT_SID must be your Twilio Account SID and should start with AC.");
  }

  return `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`;
}

function normalizeWhatsappNumber(phone) {
  const raw = String(phone || "").trim();
  if (raw.startsWith("whatsapp:")) return raw;
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  const withCountryCode = digits.startsWith("91") ? digits : `91${digits}`;
  return `whatsapp:+${withCountryCode}`;
}

function normalizeSmsNumber(phone) {
  const raw = String(phone || "").trim();
  if (raw.startsWith("+")) return raw;
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  const withCountryCode = digits.startsWith("91") ? digits : `91${digits}`;
  return `+${withCountryCode}`;
}

async function sendTwilioMessage({ from, to, body, label, fromEnvName }) {
  const accountSid = readEnv("TWILIO_ACCOUNT_SID");
  const auth = twilioAuthHeader();

  if (!accountSid || !auth) {
    throw new Error("Twilio Account SID and Auth Token are required.");
  }

  if (!from) {
    throw new Error(`${fromEnvName || `TWILIO_${String(label).toUpperCase()}_FROM`} is required.`);
  }

  const params = new URLSearchParams({
    From: from,
    To: to,
    Body: body,
  });

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: auth,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    try {
      const twilioError = JSON.parse(errorText);
      if (twilioError.code === 20003) {
        throw new Error(
          "Twilio authentication failed. Check that TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN belong to the same Twilio account."
        );
      }
    } catch (error) {
      if (error.message.includes("Twilio authentication failed")) {
        throw error;
      }
    }
    throw new Error(`Twilio ${label} error: ${errorText}`);
  }

  const data = await response.json();
  return { skipped: false, sid: data.sid, status: data.status };
}

async function sendWhatsappOtp({ to, otp }) {
  const from = readEnv("TWILIO_WHATSAPP_FROM");
  return sendTwilioMessage({
    from: from && (from.startsWith("whatsapp:") ? from : `whatsapp:${from}`),
    to: normalizeWhatsappNumber(to),
    body: `Your Panjab Sports verification OTP is ${otp}. It expires in 10 minutes.`,
    label: "WhatsApp",
    fromEnvName: "TWILIO_WHATSAPP_FROM",
  });
}

async function sendSmsOtp({ to, otp }) {
  return sendTwilioMessage({
    from: readEnv("TWILIO_SMS_FROM"),
    to: normalizeSmsNumber(to),
    body: `Your Panjab Sports verification OTP is ${otp}. It expires in 10 minutes.`,
    label: "SMS",
    fromEnvName: "TWILIO_SMS_FROM",
  });
}

module.exports = { sendWhatsappOtp, sendSmsOtp, normalizeWhatsappNumber, normalizeSmsNumber };
