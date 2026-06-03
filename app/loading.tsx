import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="glass-panel flex items-center gap-3 rounded-2xl border px-6 py-4 shadow-glow">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="text-sm font-medium text-muted-foreground">Loading attendance workspace...</span>
      </div>
    </div>
  );
}
