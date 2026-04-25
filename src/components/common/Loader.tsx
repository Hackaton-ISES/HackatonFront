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
    <div className={cn("flex flex-col items-center justify-center gap-3 text-muted-foreground", className)}>
      <Loader2 className={cn("animate-spin text-primary", sizes[size])} />
      {label && <p className="text-sm">{label}</p>}
    </div>
  );
}
