"use client"; // クライアントコンポーネントで実行
// コード行ごとにコメントを記載します。

import { useState } from "react";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { useAuth } from "./AuthContext";
import { getFirebaseServices } from "@/lib/firebase";

interface SignInButtonProps {
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  variant?: "primary" | "outline";
  className?: string;
}

export function SignInButton({
  size = "md",
  fullWidth = false,
  variant = "primary",
  className = "",
}: SignInButtonProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    try {
      setLoading(true);
      const { auth } = getFirebaseServices();
      if (!auth) throw new Error("Authが初期化されていません");

      const provider = new GoogleAuthProvider();
      provider.addScope("https://www.googleapis.com/auth/calendar");
      provider.addScope("https://www.googleapis.com/auth/calendar.events");
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("認証エラー:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      const { auth } = getFirebaseServices();
      if (!auth) throw new Error("Authが初期化されていません");

      await signOut(auth);
    } catch (error) {
      console.error("サインアウトエラー:", error);
    } finally {
      setLoading(false);
    }
  };

  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2",
    lg: "px-6 py-3 text-lg",
  };

  const baseStyles = `
    rounded-lg font-medium transition-colors duration-200 
    flex items-center justify-center
    ${sizeStyles[size]}
    ${fullWidth ? "w-full" : ""}
  `;

  const variantStyles = {
    primary: "bg-blue-500 text-white hover:bg-blue-600",
    outline: "border-2 border-blue-500 text-blue-500 hover:bg-blue-50",
  };

  const loadingStyles = "opacity-75 cursor-not-allowed";

  const buttonStyles = `
    ${baseStyles}
    ${variantStyles[variant]}
    ${loading ? loadingStyles : ""}
    ${className}
  `;

  if (user) {
    return (
      <button
        onClick={handleSignOut}
        disabled={loading}
        className={`${buttonStyles} gap-2`}
        aria-label="サインアウト"
      >
        {loading ? (
          <div
            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"
            role="status"
            aria-label="読み込み中"
          />
        ) : null}
        サインアウト
      </button>
    );
  }

  return (
    <button
      onClick={handleSignIn}
      disabled={loading}
      className={`${buttonStyles} gap-2`}
      aria-label="Googleでサインイン"
    >
      {loading ? (
        <div
          className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"
          role="status"
          aria-label="読み込み中"
        />
      ) : (
        <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
      )}
      Googleでサインイン
    </button>
  );
}
