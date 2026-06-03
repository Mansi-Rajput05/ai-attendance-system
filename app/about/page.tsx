import { BrainCircuit, Cloud, Database, Layers3, ShieldCheck, Sparkles } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const stack = [
  "Next.js App Router",
  "TypeScript",
  "Tailwind CSS",
  "shadcn-style UI",
  "FastAPI",
  "InsightFace",
  "OpenCV",
  "PyTorch anti-spoofing",
  "Prisma",
  "MongoDB",
  "Vercel",
  "Railway",
];

const highlights = [
  {
    title: "Modern Attendance Flow",
    description: "Students are registered with live camera frames, face embeddings, and profile data. Attendance scans compare live frames with cached student embeddings for fast marking.",
    icon: Sparkles,
  },
  {
    title: "Recognition Backend",
    description: "The FastAPI service runs InsightFace for detection and recognition, OpenCV for image decoding, and PyTorch-based anti-spoofing to reject fake or invalid samples.",
    icon: BrainCircuit,
  },
  {
    title: "Data Layer",
    description: "The Next.js API routes store students, attendance logs, and recognition events in MongoDB through Prisma, with short-lived candidate caching for faster recognition.",
    icon: Database,
  },
  {
    title: "Production Deployment",
    description: "The frontend is deployed on Vercel. The recognition API is deployed separately on Railway using Docker, pinned OpenCV headless dependencies, and CPU-friendly runtime settings.",
    icon: Cloud,
  },
];

export default function AboutPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="About the project"
        title="FaceMark AI attendance system"
        description="A full-stack AI attendance application built to register students, recognize live faces, prevent spoofed submissions, and maintain clean attendance records."
      />

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-slate-200 bg-slate-950 text-white dark:border-slate-800">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Project Overview</CardTitle>
              <CardDescription className="mt-2 text-slate-300">
                FaceMark AI combines a responsive Next.js dashboard with a dedicated Python recognition API for real-time student attendance.
              </CardDescription>
            </div>
            <Badge className="w-fit border-cyan-300/30 bg-cyan-300/10 text-cyan-100">AI + Full Stack</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-5 p-6 md:grid-cols-2">
          {highlights.map((item) => {
            const Icon = item.icon;

            return (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900" key={item.title}>
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="text-base font-black text-slate-950 dark:text-slate-100">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{item.description}</p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
            <CardDescription>The application separates the user interface, data APIs, and ML recognition service.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-slate-600 dark:text-slate-400">
            <p>
              The browser captures camera frames and sends them to optimized Next.js API routes. Student and attendance data is managed through Prisma and MongoDB, while recognition requests are forwarded to the Railway FastAPI backend.
            </p>
            <p>
              The Python backend decodes frames, checks liveness using anti-spoofing models, generates face embeddings through InsightFace, and returns recognition results to the frontend. Attendance logs can then be searched, deleted, cleared, and exported as CSV.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-200">
              <Layers3 className="h-5 w-5" />
            </div>
            <CardTitle>Tech Stack</CardTitle>
            <CardDescription>Core technologies used across frontend, backend, AI, and deployment.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {stack.map((item) => (
                <Badge className="rounded-xl px-3 py-1" key={item} variant="secondary">
                  {item}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <CardTitle>Deployment Architecture</CardTitle>
          <CardDescription>
            Vercel hosts the Next.js interface and server routes. Railway hosts the Dockerized FastAPI recognition backend.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
