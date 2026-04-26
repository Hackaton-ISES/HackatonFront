import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { RiskLevel } from "@/types/tender";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const suspicionLevelRank: Record<RiskLevel, number> = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2,
};

export function compareSuspicionLevelDesc<T extends { suspicionLevel: RiskLevel; suspicionScore?: number; name?: string }>(
  a: T,
  b: T,
) {
  const levelDiff = suspicionLevelRank[a.suspicionLevel] - suspicionLevelRank[b.suspicionLevel];
  if (levelDiff !== 0) return levelDiff;

  const scoreDiff = (b.suspicionScore ?? 0) - (a.suspicionScore ?? 0);
  if (scoreDiff !== 0) return scoreDiff;

  return (a.name ?? "").localeCompare(b.name ?? "");
}
