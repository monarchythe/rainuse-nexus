"use client";

import { cn } from "@/lib/utils";

function getScoreColor(score: number): string {
  if (score >= 75) return "text-emerald-600 bg-emerald-50 ring-emerald-200";
  if (score >= 55) return "text-amber-600 bg-amber-50 ring-amber-200";
  return "text-red-500 bg-red-50 ring-red-200";
}

function getScoreLabel(score: number): string {
  if (score >= 75) return "High";
  if (score >= 55) return "Medium";
  return "Low";
}

export function ScoreBadge({
  score,
  size = "md",
}: {
  score: number;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "h-10 w-10 text-sm",
    md: "h-14 w-14 text-lg",
    lg: "h-20 w-20 text-2xl",
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={cn(
          "flex items-center justify-center rounded-full font-bold ring-2",
          sizeClasses[size],
          getScoreColor(score)
        )}
      >
        {score}
      </div>
      {size !== "sm" && (
        <span
          className={cn(
            "text-xs font-medium",
            score >= 75
              ? "text-emerald-600"
              : score >= 55
                ? "text-amber-600"
                : "text-red-500"
          )}
        >
          {getScoreLabel(score)}
        </span>
      )}
    </div>
  );
}
