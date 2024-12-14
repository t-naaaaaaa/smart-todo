// src/components/ui/Error.tsx
"use client";

import { AlertTriangle, XCircle } from "lucide-react";
import { Button } from "./Button";

interface ErrorProps {
  title?: string;
  message?: string;
  error?: Error;
  retry?: () => void;
  fullScreen?: boolean;
  variant?: "error" | "warning";
  className?: string;
}

export function Error({
  title,
  message,
  error,
  retry,
  fullScreen = false,
  variant = "error",
  className = "",
}: ErrorProps) {
  const Icon = variant === "error" ? XCircle : AlertTriangle;
  const baseColor = variant === "error" ? "red" : "yellow";

  const containerStyles = fullScreen ? "fixed inset-0 bg-white" : "w-full";

  return (
    <div
      className={`
      ${containerStyles}
      flex flex-col items-center justify-center p-4
      ${className}
    `}
    >
      <Icon className={`w-12 h-12 text-${baseColor}-500 mb-4`} />

      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {title || (variant === "error" ? "エラーが発生しました" : "警告")}
        </h3>

        {message && <p className="text-gray-600 mb-4">{message}</p>}

        {error?.message && !message && (
          <p className="text-sm text-gray-500 mb-4">{error.message}</p>
        )}

        {retry && (
          <Button
            variant={variant === "error" ? "danger" : "primary"}
            onClick={retry}
          >
            再試行
          </Button>
        )}
      </div>
    </div>
  );
}
