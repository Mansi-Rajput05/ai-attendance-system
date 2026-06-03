"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Camera, ClipboardList, GraduationCap, UserPlus } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/", label: "Attendance", icon: Camera },
  { href: "/register", label: "Register New Student", icon: UserPlus },
  { href: "/attendance", label: "Logs", icon: ClipboardList },
  { href: "/students", label: "Students", icon: GraduationCap },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <Link className="flex items-center gap-3" href="/">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950">
              <Camera className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-base font-black tracking-tight">FaceTrace AI</span>
              <span className="block text-xs font-medium text-slate-500 dark:text-slate-400">AI face recognition attendance</span>
            </span>
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <nav className="flex flex-wrap gap-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;

                return (
                  <Link
                    className={cn(
                      "inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold transition",
                      active
                        ? "bg-slate-100 text-slate-950 dark:bg-slate-900 dark:text-white"
                        : "text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white",
                    )}
                    href={item.href}
                    key={item.href}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
