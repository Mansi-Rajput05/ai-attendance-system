"use client";

import { Activity, CheckCircle2, Loader2, ScanFace, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type Webcam from "react-webcam";

import { CameraPanel } from "@/components/camera-panel";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardStats, recognizeFrames, type DashboardStats } from "@/lib/recognition-api";

const initialStats: DashboardStats = {
  total_students: 0,
  today_attendance: 0,
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function statusVariant(status: string) {
  if (["REAL_FACE", "MARKED", "ALREADY_MARKED"].includes(status)) {
    return "default";
  }

  if (["UNKNOWN_FACE", "FAKE_FACE", "NO_FACE_DETECTED", "NO_FRAME_RECEIVED"].includes(status)) {
    return "destructive";
  }

  return "secondary";
}

export function DashboardClient() {
  const webcamRef = useRef<Webcam>(null);
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [status, setStatus] = useState("Waiting");
  const [name, setName] = useState("--");
  const [studentId, setStudentId] = useState<string | number>("--");
  const [attendance, setAttendance] = useState("--");
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");

  async function refreshStats() {
    try {
      setStats(await getDashboardStats());
    } catch {
      setError("Dashboard stats could not be loaded. Check the FastAPI service URL.");
    }
  }

  async function captureFrames() {
    const frames: string[] = [];

    for (let index = 0; index < 3; index += 1) {
      const frame = webcamRef.current?.getScreenshot();

      if (frame) {
        frames.push(frame);
      }

      await delay(300);
    }

    return frames;
  }

  async function startScan() {
    setScanning(true);
    setError("");
    setStatus("Scanning");

    try {
      const frames = await captureFrames();

      if (frames.length === 0) {
        throw new Error("Camera did not return frames.");
      }

      const data = await recognizeFrames(frames);

      setStatus(data.status);
      setName(data.name ?? "--");
      setStudentId(data.student_id ?? "--");
      setAttendance(data.attendance_status || "--");
      await refreshStats();
    } catch (scanError) {
      setStatus("ERROR");
      setError(scanError instanceof Error ? scanError.message : "Recognition failed.");
    } finally {
      setScanning(false);
    }
  }

  useEffect(() => {
    void refreshStats();
  }, []);

  return (
    <div>
      <PageHeader
        description="Run live face recognition, mark attendance, and monitor the recognition pipeline from a modern App Router interface."
        eyebrow="Live recognition"
        title="Attendance control center"
      />

      <div className="grid gap-4 md:grid-cols-2">
        <MetricCard detail="Registered in the recognition database" icon={Users} title="Total students" value={stats.total_students} />
        <MetricCard detail="Students marked present today" icon={CheckCircle2} title="Today attendance" value={stats.today_attendance} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        <CameraPanel
          description="Capture three frames for liveness and recognition. Keep the face centered with stable lighting."
          ref={webcamRef}
          title="Recognition camera"
        />

        <Card className="glass-panel border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Scan result
            </CardTitle>
            <CardDescription>FastAPI returns liveness, identity, and attendance status.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3">
              <div className="flex items-center justify-between rounded-xl border bg-background/60 p-4">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant={statusVariant(status)}>{status}</Badge>
              </div>
              <InfoRow label="Name" value={name} />
              <InfoRow label="Student ID" value={studentId} />
              <InfoRow label="Attendance" value={attendance} />
            </div>

            {error ? <p className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}

            <Button className="w-full" disabled={scanning} onClick={startScan} size="lg">
              {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanFace className="h-4 w-4" />}
              {scanning ? "Scanning..." : "Start scan"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between rounded-xl border bg-background/60 p-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}
