// src/components/ui/Loading.tsx

import { Loader2 } from "lucide-react";

interface LoadingProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

export function Loading({
  size = "md",
  text,
  fullScreen = false,
  className = "",
}: LoadingProps) {
  const sizeStyles = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const containerStyles = fullScreen
    ? "fixed inset-0 bg-white/80 backdrop-blur-sm"
    : "w-full";

  return (
    <div
      className={`
      ${containerStyles}
      flex flex-col items-center justify-center
      ${className}
    `}
    >
      <Loader2
        className={`
        animate-spin text-blue-500
        ${sizeStyles[size]}
      `}
      />
      {text && <p className="mt-2 text-sm text-gray-600">{text}</p>}
    </div>
  );
}
