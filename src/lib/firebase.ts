"use client"; // クライアント側でのみ実行する宣言
// コード行ごとにコメントを記載します。

import { initializeApp, getApps, FirebaseApp } from "firebase/app"; // Firebaseアプリ初期化関連
import { getAuth, Auth } from "firebase/auth"; // Firebase認証を取得する関数と型
import { getFirestore, Firestore } from "firebase/firestore"; // Firestore関連

// Firebase 設定オブジェクト
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY, // 公開可能なFirebase APIキー
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, // 認証ドメイン
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, // プロジェクトID
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, // ストレージバケット
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID, // メッセージング用ID
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID, // アプリID
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};
console.log(process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
console.log(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN);
console.log(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
console.log(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
console.log(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID);
console.log(process.env.NEXT_PUBLIC_FIREBASE_APP_ID);
console.log(firebaseConfig);
let app: FirebaseApp | null = null; // FirebaseAppインスタンスを格納する変数
let auth: Auth | null = null; // Authインスタンス
let db: Firestore | null = null; // Firestoreインスタンス
let initialized = false; // 初期化フラグ

export function getFirebaseServices() {
  // ブラウザ環境か確認
  if (typeof window === "undefined") {
    // SSR環境ではnullを返す
    return { auth: null, db: null };
  }

  // 初期化済みなら使い回す
  if (initialized && app && auth && db) {
    return { auth, db };
  }

  // Firebaseアプリを初期化
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

  // AuthとFirestoreインスタンスを取得
  auth = getAuth(app);
  db = getFirestore(app);
  initialized = true;

  return { auth, db };
}
