import { AlertCircle, CheckCircle2, Info, UserCheck, UserX } from "lucide-react";

import { cn } from "@/lib/utils";

type ScanResultAlertProps = {
  result: Record<string, unknown> | null;
  title?: string;
};

const styles = {
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900/80 dark:bg-emerald-950/30 dark:text-emerald-100",
  warning:
    "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/80 dark:bg-amber-950/30 dark:text-amber-100",
  error: "border-red-200 bg-red-50 text-red-950 dark:border-red-900/80 dark:bg-red-950/30 dark:text-red-100",
  info: "border-slate-200 bg-white text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300",
};

export function ScanResultAlert({ result, title = "Scan Status" }: ScanResultAlertProps) {
  if (!result) {
    return (
      <div className={cn("rounded-2xl border p-4", styles.info)}>
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-bold">{title}</p>
            <p className="mt-1 text-sm opacity-80">Start the camera and begin scanning to see live attendance updates.</p>
          </div>
        </div>
      </div>
    );
  }

  const status = String(result.status ?? (result.error ? "ERROR" : "INFO"));
  const message = String(result.message ?? result.error ?? "Scan completed.");
  const student = result.student as { studentId?: string | number; name?: string } | undefined;
  const tone =
    status === "REGISTERED" || status === "REAL_FACE" || status === "MARKED"
      ? "success"
      : status === "ALREADY_MARKED"
        ? "warning"
        : status === "ERROR" || status === "FAKE_FACE" || status === "UNKNOWN_FACE" || status === "NO_FACE_DETECTED"
          ? "error"
          : "info";
  const Icon =
    tone === "success" ? UserCheck : tone === "warning" ? CheckCircle2 : tone === "error" ? UserX : AlertCircle;

  return (
    <div className={cn("rounded-2xl border p-4 shadow-sm", styles[tone])}>
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-bold">{message}</p>
            <span className="rounded-full bg-white/60 px-2.5 py-1 text-[0.68rem] font-black uppercase tracking-[0.18em] dark:bg-white/10">
              {status.replaceAll("_", " ")}
            </span>
          </div>
          {student?.name ? (
            <p className="mt-2 text-sm opacity-85">
              Student: <span className="font-semibold">{student.name}</span>
              {student.studentId ? <span> ({student.studentId})</span> : null}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
