import { initializeApp } from "firebase/app";
import {
  browserLocalPersistence,
  getAuth,
  GoogleAuthProvider,
  setPersistence,
} from "firebase/auth";

// These keys must be defined in your client/.env file
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const requiredFirebaseValues = [
  firebaseConfig.apiKey,
  firebaseConfig.authDomain,
  firebaseConfig.projectId,
  firebaseConfig.appId,
];

export const isFirebaseConfigured = requiredFirebaseValues.every(
  (value) => typeof value === "string" && value.trim() && !value.includes("your_")
);

let app = null;
let firebaseAuth = null;
let provider = null;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    firebaseAuth = getAuth(app);
    provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    setPersistence(firebaseAuth, browserLocalPersistence).catch((error) => {
      console.error("Firebase persistence setup failed", error);
    });
  } catch (error) {
    console.error("Firebase initialization failed", error);
    firebaseAuth = null;
    provider = null;
  }
}

export { app };
export const auth = firebaseAuth;
export const googleProvider = provider;
