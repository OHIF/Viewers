import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

/**
 * Firebase configuration loaded from environment variables.
 * Set these in platform/app/.env (never commit real values to source control).
 */
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// Avoid re-initializing on hot reloads
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const firebaseAuth = getAuth(app);
export default app;
