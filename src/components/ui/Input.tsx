// src/components/ui/Input.tsx

import { forwardRef } from "react";
import { AlertCircle } from "lucide-react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  isLoading?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      isLoading = false,
      disabled,
      className = "",
      ...props
    },
    ref
  ) => {
    // ベーススタイル
    const baseInputStyles = `
    block
    rounded-lg
    border
    bg-white
    px-3
    py-2
    text-gray-900
    placeholder:text-gray-500
    focus:outline-none
    focus:ring-2
    focus:ring-offset-2
    disabled:cursor-not-allowed
    disabled:opacity-50
  `;

    // 状態に基づくスタイル
    const stateStyles = {
      normal: "border-gray-300 focus:border-blue-500 focus:ring-blue-500",
      error: "border-red-500 focus:border-red-500 focus:ring-red-500",
      withLeftIcon: "pl-10",
      withRightIcon: "pr-10",
      fullWidth: "w-full",
    };

    const combinedInputClassName = `
    ${baseInputStyles}
    ${error ? stateStyles.error : stateStyles.normal}
    ${leftIcon ? stateStyles.withLeftIcon : ""}
    ${rightIcon ? stateStyles.withRightIcon : ""}
    ${fullWidth ? stateStyles.fullWidth : ""}
    ${className}
  `;

    return (
      <div className={`${fullWidth ? "w-full" : ""}`}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            disabled={disabled || isLoading}
            className={combinedInputClassName}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {rightIcon}
            </div>
          )}

          {error && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">
              <AlertCircle className="w-5 h-5" />
            </div>
          )}
        </div>

        {(error || helperText) && (
          <p
            className={`mt-1 text-sm ${
              error ? "text-red-500" : "text-gray-500"
            }`}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

// TextAreaコンポーネント
export interface TextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    { label, error, helperText, fullWidth = false, className = "", ...props },
    ref
  ) => {
    const baseStyles = `
    block
    rounded-lg
    border
    bg-white
    px-3
    py-2
    text-gray-900
    placeholder:text-gray-500
    focus:outline-none
    focus:ring-2
    focus:ring-offset-2
    disabled:cursor-not-allowed
    disabled:opacity-50
    min-h-[100px]
  `;

    const stateStyles = {
      normal: "border-gray-300 focus:border-blue-500 focus:ring-blue-500",
      error: "border-red-500 focus:border-red-500 focus:ring-red-500",
      fullWidth: "w-full",
    };

    const combinedClassName = `
    ${baseStyles}
    ${error ? stateStyles.error : stateStyles.normal}
    ${fullWidth ? stateStyles.fullWidth : ""}
    ${className}
  `;

    return (
      <div className={`${fullWidth ? "w-full" : ""}`}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}

        <textarea ref={ref} className={combinedClassName} {...props} />

        {(error || helperText) && (
          <p
            className={`mt-1 text-sm ${
              error ? "text-red-500" : "text-gray-500"
            }`}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

TextArea.displayName = "TextArea";
