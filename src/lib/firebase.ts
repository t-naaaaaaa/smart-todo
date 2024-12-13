"use client";

import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { Auth, initializeAuth, browserLocalPersistence } from "firebase/auth";
import { Firestore, getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let _app: FirebaseApp | undefined = undefined;
let _auth: Auth | undefined = undefined;
let _db: Firestore | undefined = undefined;
let isInitialized = false;

function initializeFirebase() {
  if (typeof window === "undefined") return null;

  try {
    if (isInitialized && _app && _auth && _db) {
      return { app: _app, auth: _auth, db: _db };
    }

    _app =
      getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

    // Auth の明示的な初期化
    _auth = initializeAuth(_app, {
      persistence: browserLocalPersistence,
    });

    _db = getFirestore(_app);

    isInitialized = true;
    return { app: _app, auth: _auth, db: _db };
  } catch (error) {
    console.error("Firebase initialization error:", error);
    return null;
  }
}

export function ensureFirebaseInitialized() {
  if (typeof window === "undefined") {
    throw new Error("Firebase can only be initialized on the client side");
  }

  const instance = initializeFirebase();
  if (!instance) {
    throw new Error("Failed to initialize Firebase");
  }

  return instance;
}
