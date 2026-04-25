import { Loader2 } from "lucide-react";

export function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
      <Loader2 className="h-8 w-8 text-muted-foreground animate-spin mb-3" />
      <p className="text-sm text-muted-foreground">Loading tenders...</p>
    </div>
  );
}
