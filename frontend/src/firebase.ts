import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const functions = getFunctions(app, "asia-northeast1");

if (import.meta.env.VITE_USE_EMULATOR === "true") {
  const firestoreHost = import.meta.env.VITE_FIRESTORE_EMULATOR_HOST as string;
  const functionsHost = import.meta.env.VITE_FUNCTIONS_EMULATOR_HOST as string;
  connectFirestoreEmulator(db, firestoreHost, 8080);
  connectFunctionsEmulator(functions, functionsHost, 5001);
}
