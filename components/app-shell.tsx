"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrainCircuit, ClipboardList, Gauge, GraduationCap, UserPlus } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/", label: "Dashboard", icon: Gauge },
  { href: "/register", label: "Register", icon: UserPlus },
  { href: "/attendance", label: "Attendance", icon: ClipboardList },
  { href: "/students", label: "Students", icon: GraduationCap },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <Link className="flex items-center gap-3" href="/">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-glow">
                <BrainCircuit className="h-6 w-6" />
              </span>
              <span className="min-w-0">
                <span className="block text-base font-semibold tracking-tight sm:text-lg">AI Attendance</span>
                <span className="block text-xs text-muted-foreground">Face recognition control center</span>
              </span>
            </Link>
            <div className="flex items-center gap-2">
              <Badge className="hidden border-primary/30 bg-primary/10 text-primary sm:inline-flex" variant="outline">
                Railway API Ready
              </Badge>
              <ThemeToggle />
            </div>
          </div>
          <nav className="flex gap-2 overflow-x-auto pb-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;

              return (
                <Link
                  className={cn(
                    "flex min-w-fit items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                    active
                      ? "border-primary/40 bg-primary text-primary-foreground shadow-glow"
                      : "bg-card/70 text-muted-foreground hover:bg-accent hover:text-accent-foreground",
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
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
