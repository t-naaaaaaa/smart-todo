// src/components/ui/Card.tsx
"use client";

import { forwardRef } from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "hover" | "interactive";
  padding?: "none" | "sm" | "md" | "lg";
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    { children, variant = "default", padding = "md", className = "", ...props },
    ref
  ) => {
    const baseStyles = "bg-white rounded-lg shadow-sm border border-gray-200";

    const variantStyles = {
      default: "",
      hover: "transition-shadow duration-200 hover:shadow-md",
      interactive:
        "transition-all duration-200 hover:shadow-md hover:border-blue-300 cursor-pointer",
    };

    const paddingStyles = {
      none: "",
      sm: "p-3",
      md: "p-4",
      lg: "p-6",
    };

    const combinedClassName = `
    ${baseStyles}
    ${variantStyles[variant]}
    ${paddingStyles[padding]}
    ${className}
  `;

    return (
      <div ref={ref} className={combinedClassName} {...props}>
        {children}
      </div>
    );
  }
);

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ title, description, action, className = "", ...props }, ref) => {
    return (
      <div ref={ref} className={`space-y-1.5 ${className}`} {...props}>
        <div className="flex items-center justify-between">
          {title && (
            <h3 className="font-semibold leading-none tracking-tight">
              {title}
            </h3>
          )}
          {action && <div>{action}</div>}
        </div>
        {description && <p className="text-sm text-gray-500">{description}</p>}
      </div>
    );
  }
);

export interface CardContentProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className = "", ...props }, ref) => {
    return <div ref={ref} className={className} {...props} />;
  }
);

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className = "", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`flex items-center pt-4 ${className}`}
        {...props}
      />
    );
  }
);

Card.displayName = "Card";
CardHeader.displayName = "CardHeader";
CardContent.displayName = "CardContent";
CardFooter.displayName = "CardFooter";
