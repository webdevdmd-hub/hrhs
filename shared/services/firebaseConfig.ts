import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const {
  VITE_FIREBASE_API_KEY,
  VITE_FIREBASE_AUTH_DOMAIN,
  VITE_FIREBASE_PROJECT_ID,
  VITE_FIREBASE_STORAGE_BUCKET,
  VITE_FIREBASE_MESSAGING_SENDER_ID,
  VITE_FIREBASE_APP_ID,
  VITE_FIREBASE_MEASUREMENT_ID
} = import.meta.env;

const firebaseConfig = (() => {
  const requiredConfig = {
    apiKey: VITE_FIREBASE_API_KEY,
    authDomain: VITE_FIREBASE_AUTH_DOMAIN,
    projectId: VITE_FIREBASE_PROJECT_ID,
    storageBucket: VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: VITE_FIREBASE_APP_ID
  };

  const missingKeys = Object.entries(requiredConfig)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missingKeys.length) {
    throw new Error(`Missing Firebase environment variables: ${missingKeys.join(", ")}`);
  }

  return {
    ...requiredConfig,
    ...(VITE_FIREBASE_MEASUREMENT_ID ? { measurementId: VITE_FIREBASE_MEASUREMENT_ID } : {})
  };
})();

// Initialize Firebase
// Check if already initialized to prevent "Firebase App named '[DEFAULT]' already exists" errors during hot reload
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Services
export const db = getFirestore(app);

// Initialize Analytics safely
// Use try-catch to prevent crash if Analytics is not supported or fails to register (causes white screen)
let analyticsInstance = null;
try {
  analyticsInstance = getAnalytics(app);
} catch (error) {
  console.warn("Firebase Analytics initialization failed:", error);
}

export const analytics = analyticsInstance;

export default app;
