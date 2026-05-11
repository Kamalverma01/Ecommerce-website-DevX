const disposableDomains = new Set([
  "10minutemail.com",
  "guerrillamail.com",
  "mailinator.com",
  "tempmail.com",
  "temp-mail.org",
  "yopmail.com",
  "dispostable.com",
  "fakeinbox.com",
  "sharklasers.com",
  "trashmail.com",
  "maildrop.cc",
]);

function isDisposableEmail(email = "") {
  const domain = String(email).toLowerCase().split("@")[1] || "";
  return disposableDomains.has(domain);
}

module.exports = {
  isDisposableEmail,
};
