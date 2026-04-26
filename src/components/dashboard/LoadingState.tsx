import { Loader2 } from "lucide-react";

export function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 animate-scale-in">
      <div className="relative mb-4 flex items-center justify-center">
        <span className="absolute h-14 w-14 rounded-full border border-primary/10 animate-soft-pulse" />
        <span className="absolute h-9 w-9 rounded-full border border-primary/20" />
        <Loader2 className="relative h-8 w-8 text-primary animate-spin" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">Loading data...</p>
    </div>
  );
}
