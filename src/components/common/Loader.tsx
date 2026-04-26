import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoaderProps {
  label?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

export function Loader({ label, className, size = "md" }: LoaderProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-4 text-muted-foreground", className)}>
      <div className="relative flex items-center justify-center">
        <span className="absolute h-12 w-12 rounded-full border border-primary/10 animate-soft-pulse" />
        <span className="absolute h-8 w-8 rounded-full border border-primary/20" />
        <Loader2 className={cn("relative animate-spin text-primary drop-shadow-sm", sizes[size])} />
      </div>
      {label && <p className="text-sm font-medium tracking-tight animate-fade-in">{label}</p>}
    </div>
  );
}
