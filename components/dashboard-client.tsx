"use client";

import { Database, Repeat, ShieldCheck, Users } from "lucide-react";
import { useEffect, useState } from "react";

import { CameraPanel } from "@/components/camera-panel";
import { ScanResultAlert } from "@/components/scan-result-alert";
import { Badge } from "@/components/ui/badge";
import { getDashboardStats, type DashboardStats } from "@/lib/recognition-api";

const initialStats: DashboardStats = {
  total_students: 0,
  today_attendance: 0,
};

export function DashboardClient() {
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [stats, setStats] = useState<DashboardStats>(initialStats);

  async function refreshStats() {
    try {
      setStats(await getDashboardStats());
    } catch {
      setResult({ status: "ERROR", message: "Dashboard stats could not be loaded. Check the FastAPI service URL." });
    }
  }

  async function handleResult(nextResult: Record<string, unknown>) {
    setResult(nextResult);

    if (nextResult.status === "REAL_FACE") {
      await refreshStats();
    }
  }

  useEffect(() => {
    void refreshStats();
  }, []);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-8 p-6 lg:grid-cols-[0.95fr_1.05fr] lg:p-8">
          <div className="flex flex-col justify-between gap-8">
            <div className="space-y-5">
              <Badge>Primary biometric attendance</Badge>
              <div className="space-y-4">
                <h1 className="max-w-xl text-4xl font-black tracking-tight text-slate-950 dark:text-slate-100 sm:text-5xl">
                  Start attendance with a live camera loop.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-400">
                  Turn on the camera once, start the attendance loop, and the app will keep scanning until you stop it.
                  Recognized students are sent to the FastAPI recognition service and attendance is marked automatically.
                </p>
              </div>
              <ScanResultAlert result={result} title="Live Attendance Alert" />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Stat icon={Repeat} label="Scan mode" value="Loop" />
              <Stat icon={Database} label="Storage" value="MongoDB + API" />
              <Stat icon={Users} label="Students" value={String(stats.total_students)} />
            </div>
          </div>
          <CameraPanel mode="attendance" onResult={handleResult} />
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          Keep only one face in frame. Unknown faces continue through the loop and retry automatically after the next scan cycle.
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          Today&apos;s attendance count: <span className="font-black text-slate-950 dark:text-slate-100">{stats.today_attendance}</span>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof ShieldCheck; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
      <Icon className="mb-3 h-5 w-5 text-slate-600 dark:text-slate-400" />
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-black text-slate-950 dark:text-slate-100">{value}</p>
    </div>
  );
}
