"use client";

import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingState({
  message = "Loading...",
  size = "md",
  className = ""
}: LoadingStateProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12"
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg"
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-4 p-8 ${className}`}>
      <div className="relative">
        <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />
        <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-pulse"></div>
      </div>
      <p className={`text-muted-foreground ${textSizeClasses[size]} font-medium`}>
        {message}
      </p>
    </div>
  );
}

