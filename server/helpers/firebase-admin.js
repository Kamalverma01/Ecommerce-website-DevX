const admin = require("firebase-admin");

function getFirebaseConfig() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    : "";

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  return {
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  };
}

function getFirebaseAdmin() {
  const existingApp = admin.apps.length ? admin.app() : null;
  if (existingApp) return admin;

  const config = getFirebaseConfig();
  if (!config) return null;

  admin.initializeApp(config);
  return admin;
}

async function verifyFirebaseToken(idToken) {
  const firebaseAdmin = getFirebaseAdmin();
  if (!firebaseAdmin) {
    throw new Error("Firebase Admin is not configured");
  }

  return firebaseAdmin.auth().verifyIdToken(idToken);
}

module.exports = {
  getFirebaseAdmin,
  verifyFirebaseToken,
};
