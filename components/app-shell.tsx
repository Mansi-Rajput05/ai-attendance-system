"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Camera, ClipboardList, GraduationCap, Info, Menu, ScanFace, UserPlus, X } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/", label: "Attendance", icon: Camera },
  { href: "/register", label: "Register", icon: UserPlus },
  { href: "/attendance", label: "Logs", icon: ClipboardList },
  { href: "/students", label: "Students", icon: GraduationCap },
  { href: "/about", label: "About", icon: Info },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const navItems = navigation.map((item) => {
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
  });

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-6xl flex-col px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <Link className="flex min-w-0 items-center gap-3" href="/">
              <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-blue-900 to-cyan-600 text-white shadow-sm shadow-cyan-900/20 dark:from-cyan-400 dark:via-blue-500 dark:to-slate-950">
                <ScanFace className="h-5 w-5" />
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-emerald-300" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-base font-black tracking-tight">FaceMark AI</span>
                <span className="block truncate text-xs font-medium text-slate-500 dark:text-slate-400">
                  AI face recognition attendance
                </span>
              </span>
            </Link>
            <div className="flex items-center gap-2">
              <nav className="hidden items-center gap-2 md:flex">{navItems}</nav>
              <ThemeToggle />
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900 md:hidden"
                aria-label="Toggle navigation"
                aria-expanded={mobileMenuOpen}
                onClick={() => setMobileMenuOpen((open) => !open)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
          {mobileMenuOpen ? (
            <nav className="mt-3 grid gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-950 md:hidden">
              {navItems}
            </nav>
          ) : null}
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
      <footer className="border-t border-slate-200 bg-white/80 dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-slate-500 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-semibold text-slate-700 dark:text-slate-300">FaceMark AI</span>
          <span>@2026 design and developed by Mansi, Indian Institute of Technology Roorkee</span>
        </div>
      </footer>
    </div>
  );
}
