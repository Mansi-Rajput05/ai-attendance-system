"use client";

import { CheckCircle2, Loader2, ShieldCheck, UserPlus } from "lucide-react";
import { useRef, useState } from "react";
import type Webcam from "react-webcam";

import { CameraPanel } from "@/components/camera-panel";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerStudent } from "@/lib/recognition-api";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const statusMessages: Record<string, string> = {
  REGISTERED: "Student registered successfully.",
  STUDENT_ALREADY_EXISTS: "Student already exists.",
  FAKE_FACE: "Fake face detected. Registration blocked.",
  NO_FACE_DETECTED: "No valid face detected.",
};

export function RegisterClient() {
  const webcamRef = useRef<Webcam>(null);
  const [studentId, setStudentId] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState("Waiting");
  const [message, setMessage] = useState("");
  const [registering, setRegistering] = useState(false);

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

  async function handleRegister() {
    if (!studentId || !name.trim()) {
      setStatus("ERROR");
      setMessage("Student ID and name are required.");
      return;
    }

    setRegistering(true);
    setStatus("Registering");
    setMessage("");

    try {
      const frames = await captureFrames();

      if (frames.length < 3) {
        throw new Error("Camera did not capture enough frames.");
      }

      const data = await registerStudent(Number(studentId), name.trim(), frames);
      setStatus(data.status);
      setMessage(statusMessages[data.status] ?? "Registration completed.");

      if (data.status === "REGISTERED") {
        setStudentId("");
        setName("");
      }
    } catch (error) {
      setStatus("ERROR");
      setMessage(error instanceof Error ? error.message : "Registration failed.");
    } finally {
      setRegistering(false);
    }
  }

  return (
    <div>
      <PageHeader
        description="Enroll new faces with anti-spoofing validation before saving the embedding to the recognition backend."
        eyebrow="Student enrollment"
        title="Register a student"
      />

      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-6">
          <Card className="glass-panel border-primary/20">
            <CardHeader>
              <CardTitle>Student details</CardTitle>
              <CardDescription>Use a unique numeric student ID and the official display name.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="student-id">Student ID</Label>
                <Input
                  id="student-id"
                  inputMode="numeric"
                  placeholder="101"
                  type="number"
                  value={studentId}
                  onChange={(event) => setStudentId(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="student-name">Student name</Label>
                <Input
                  id="student-name"
                  placeholder="Student full name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>
              <Button className="w-full" disabled={registering} onClick={handleRegister} size="lg">
                {registering ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                {registering ? "Registering..." : "Register student"}
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-panel border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Capture guidelines
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              {[
                "Look directly at the camera.",
                "Keep the face clearly visible.",
                "Use stable lighting and avoid motion blur.",
              ].map((item) => (
                <div className="flex items-center gap-2" key={item}>
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <CameraPanel
            description="Three frames are sent to FastAPI for liveness checks and embedding generation."
            ref={webcamRef}
            title="Registration camera"
          />

          <Card className="glass-panel border-primary/20">
            <CardContent className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current status</p>
                <Badge className="mt-2" variant={status === "ERROR" ? "destructive" : status === "REGISTERED" ? "default" : "secondary"}>
                  {status}
                </Badge>
              </div>
              <p className="max-w-xl text-sm text-muted-foreground">{message || "Ready to capture and register a student."}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
