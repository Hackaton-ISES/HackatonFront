import { Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/types/tender";

interface RiskBadgeProps {
  score: number;
  level: RiskLevel;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const levelStyles: Record<RiskLevel, string> = {
  LOW: "bg-risk-low-bg text-risk-low border-risk-low-border",
  MEDIUM: "bg-risk-medium-bg text-risk-medium border-risk-medium-border",
  HIGH: "bg-risk-high-bg text-risk-high border-risk-high-border",
};

const dotStyles: Record<RiskLevel, string> = {
  LOW: "fill-risk-low text-risk-low",
  MEDIUM: "fill-risk-medium text-risk-medium",
  HIGH: "fill-risk-high text-risk-high",
};

const sizeStyles = {
  sm: "text-xs px-2 py-0.5 gap-1",
  md: "text-sm px-2.5 py-1 gap-1.5",
  lg: "text-base px-3 py-1.5 gap-2",
};

export function RiskBadge({ score, level, size = "md", showLabel = true, className }: RiskBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-mono font-semibold tabular-nums transition-all",
        levelStyles[level],
        sizeStyles[size],
        className,
      )}
    >
      <Circle className={cn("shrink-0", dotStyles[level], size === "sm" ? "h-2 w-2" : "h-2.5 w-2.5")} />
      <span>{score}</span>
      {showLabel && <span className="font-sans font-medium opacity-80">· {level}</span>}
    </span>
  );
}
