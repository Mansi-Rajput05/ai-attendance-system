import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <Loader2 className="h-5 w-5 animate-spin text-slate-600 dark:text-slate-400" />
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading FaceMark AI...</span>
      </div>
    </div>
  );
}
