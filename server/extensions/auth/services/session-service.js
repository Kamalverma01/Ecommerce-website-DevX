const crypto = require("crypto");

const sessionStore = new Map();

function createSession({ userId, rememberMe = false, userAgent = "", ip = "" }) {
  const sessionId = crypto.randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + (rememberMe ? 7 : 1) * 24 * 60 * 60 * 1000);

  const entry = {
    id: sessionId,
    userId: String(userId),
    createdAt: now,
    expiresAt,
    userAgent,
    ip,
    lastSeenAt: now,
  };

  sessionStore.set(sessionId, entry);
  return entry;
}

function touchSession(sessionId) {
  const entry = sessionStore.get(sessionId);
  if (!entry) return null;
  entry.lastSeenAt = new Date();
  sessionStore.set(sessionId, entry);
  return entry;
}

function invalidateSession(sessionId) {
  sessionStore.delete(sessionId);
}

function invalidateAllUserSessions(userId) {
  for (const [key, value] of sessionStore.entries()) {
    if (value.userId === String(userId)) {
      sessionStore.delete(key);
    }
  }
}

function getSession(sessionId) {
  const entry = sessionStore.get(sessionId);
  if (!entry) return null;
  if (entry.expiresAt < new Date()) {
    sessionStore.delete(sessionId);
    return null;
  }
  return entry;
}

function listUserSessions(userId) {
  return Array.from(sessionStore.values()).filter((entry) => entry.userId === String(userId));
}

module.exports = {
  createSession,
  touchSession,
  invalidateSession,
  invalidateAllUserSessions,
  getSession,
  listUserSessions,
};
