import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { AppShell } from "@/components/app-shell";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";

import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FaceMark AI",
  description: "Modern AI face recognition attendance dashboard powered by Next.js and FastAPI.",
  icons: {
    icon: "/image.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AppShell>{children}</AppShell>
          <Toaster
            closeButton
            richColors
            position="top-right"
            toastOptions={{
              className: "rounded-2xl border-slate-200 dark:border-slate-800",
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
