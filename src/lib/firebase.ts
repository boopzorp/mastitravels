// src/lib/firebase.ts
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
// import { getAuth } from 'firebase/auth'; // For later auth if needed

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Optional
};

let app: FirebaseApp;

// Ensure Firebase is initialized only once
if (!getApps().length) {
  if (firebaseConfig.projectId) { // Basic check if config is somewhat populated
    app = initializeApp(firebaseConfig);
  } else {
    console.error("Firebase config is missing. Please check your .env file and Firebase project setup.");
    // Fallback or throw error, for now, app might be undefined if config is missing
    // This could lead to errors downstream if not handled.
    // Consider a more robust way to handle this, e.g. disabling Firestore features.
    app = {} as FirebaseApp; // Placeholder to avoid immediate crash, but Firestore will fail
  }
} else {
  app = getApps()[0];
}

let db: Firestore;
// Initialize Firestore only if app was successfully initialized and projectId is present
if (app && app.options?.projectId) {
  db = getFirestore(app);
} else {
  console.error("Firestore could not be initialized due to missing Firebase app configuration.");
  db = {} as Firestore; // Placeholder
}

// const auth = getAuth(app); // For later auth

export { app, db /*, auth */ };
