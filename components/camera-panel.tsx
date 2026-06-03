"use client";

import { Camera, Loader2, ScanFace, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { recognizeFrames, registerStudent } from "@/lib/recognition-api";

type CameraPanelProps = {
  mode: "attendance" | "register";
  studentId?: string;
  name?: string;
  onResult?: (result: Record<string, unknown>) => void | Promise<void>;
};

const REGISTRATION_FRAME_COUNT = 5;
const ATTENDANCE_FRAME_COUNT = 1;
const REGISTRATION_CAPTURE_INTERVAL_MS = 180;
const LOOP_DELAY_MS = 300;
const ATTENDANCE_MAX_FRAME_WIDTH = 480;
const REGISTRATION_MAX_FRAME_WIDTH = 640;

function normalizeRecognitionResult(result: Awaited<ReturnType<typeof recognizeFrames>>) {
  const message =
    result.status === "REAL_FACE"
      ? result.attendance_status === "ALREADY_MARKED"
        ? "Attendance already marked"
        : "Attendance marked"
      : result.status.replaceAll("_", " ");

  return {
    ...result,
    message,
    student: result.name
      ? {
          studentId: result.student_id,
          name: result.name,
        }
      : undefined,
  };
}

function normalizeRegisterResult(result: Awaited<ReturnType<typeof registerStudent>>) {
  const messages: Record<string, string> = {
    REGISTERED: "Student registered successfully",
    STUDENT_ALREADY_EXISTS: "Student already exists",
    FAKE_FACE: "Fake face detected",
    NO_FACE_DETECTED: "No valid face detected",
  };

  return {
    ...result,
    message: messages[result.status] ?? result.status.replaceAll("_", " "),
    student: result.name
      ? {
          studentId: result.student_id,
          name: result.name,
        }
      : undefined,
  };
}

export function CameraPanel({ mode, studentId, name, onResult }: CameraPanelProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loopActive, setLoopActive] = useState(false);
  const [status, setStatus] = useState("Camera is off");

  useEffect(() => {
    return () => {
      scanningRef.current = false;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, []);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraReady(true);
      setStatus("Camera ready. Keep your face centered.");
    } catch {
      const errorResult = { status: "ERROR", message: "Camera permission failed. Allow camera access and try again." };
      setStatus(errorResult.message);
      await onResult?.(errorResult);
    }
  }

  function stopAttendanceLoop() {
    scanningRef.current = false;
    setLoopActive(false);
  }

  function stopCamera() {
    stopAttendanceLoop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraReady(false);
    setStatus("Camera is off");
  }

  async function captureFrames() {
    if (!videoRef.current || !canvasRef.current) {
      return [];
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) {
      return [];
    }

    const sourceWidth = video.videoWidth || 640;
    const sourceHeight = video.videoHeight || 480;
    const maxWidth = mode === "attendance" ? ATTENDANCE_MAX_FRAME_WIDTH : REGISTRATION_MAX_FRAME_WIDTH;
    const scale = Math.min(1, maxWidth / sourceWidth);

    canvas.width = Math.round(sourceWidth * scale);
    canvas.height = Math.round(sourceHeight * scale);

    const frames: string[] = [];
    const frameCount = mode === "attendance" ? ATTENDANCE_FRAME_COUNT : REGISTRATION_FRAME_COUNT;
    const quality = mode === "attendance" ? 0.72 : 0.82;

    for (let index = 0; index < frameCount; index += 1) {
      context.save();
      context.translate(canvas.width, 0);
      context.scale(-1, 1);
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      context.restore();
      frames.push(canvas.toDataURL("image/jpeg", quality));

      if (index < frameCount - 1) {
        await new Promise((resolve) => setTimeout(resolve, REGISTRATION_CAPTURE_INTERVAL_MS));
      }
    }

    return frames;
  }

  async function performCapture() {
    setLoading(true);
    setStatus(mode === "register" ? "Capturing registration frames..." : "Scanning face...");

    try {
      const trimmedName = String(name ?? "").trim();
      const numericStudentId = Number(studentId);

      if (mode === "register" && (!studentId || !Number.isInteger(numericStudentId) || numericStudentId <= 0)) {
        throw new Error("Enter a valid numeric student ID before registering.");
      }

      if (mode === "register" && trimmedName.length < 2) {
        throw new Error("Enter the student name before registering.");
      }

      const frames = await captureFrames();

      if (frames.length === 0) {
        throw new Error("Camera did not capture a frame.");
      }

      const result =
        mode === "register"
          ? normalizeRegisterResult(await registerStudent(numericStudentId, trimmedName, frames))
          : normalizeRecognitionResult(await recognizeFrames(frames));

      setStatus(String(result.message || result.status || "Success"));
      if (["REGISTERED", "REAL_FACE", "MARKED"].includes(String(result.status))) {
        toast.success(String(result.message || "Success"));
      } else if (String(result.status) === "ALREADY_MARKED") {
        toast.warning(String(result.message || "Attendance already marked"));
      } else {
        toast.error(String(result.message || result.status || "Request failed"));
      }
      await onResult?.(result);
      return result;
    } catch (error) {
      const errorResult = { status: "ERROR", message: error instanceof Error ? error.message : "Capture failed" };
      setStatus(errorResult.message);
      toast.error(errorResult.message);
      await onResult?.(errorResult);
      return errorResult;
    } finally {
      setLoading(false);
    }
  }

  async function runAttendanceLoop() {
    if (mode !== "attendance" || scanningRef.current) {
      return;
    }

    scanningRef.current = true;
    setLoopActive(true);

    while (scanningRef.current && streamRef.current) {
      await performCapture();

      if (scanningRef.current) {
        await new Promise((resolve) => setTimeout(resolve, LOOP_DELAY_MS));
      }
    }

    scanningRef.current = false;
    setLoopActive(false);
  }

  async function submitCapture() {
    if (mode === "attendance") {
      await runAttendanceLoop();
      return;
    }

    await performCapture();
  }

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 shadow-sm dark:border-slate-800">
        <video ref={videoRef} className="aspect-video w-full scale-x-[-1] object-cover" playsInline muted />
        {!cameraReady ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950 text-white">
            <Camera className="h-10 w-10 text-slate-400" />
            <p className="text-sm font-medium text-slate-300">Camera preview will appear here</p>
          </div>
        ) : null}
        <div className="absolute left-4 top-4">
          <Badge className="bg-white/90 text-slate-700 backdrop-blur dark:bg-slate-900/85 dark:text-slate-300">
            {mode === "register" ? "Registration" : "Attendance"}
          </Badge>
        </div>
        {loopActive ? (
          <div className="absolute right-4 top-4 rounded-full bg-emerald-600 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-white">
            Live Loop
          </div>
        ) : null}
      </div>
      <canvas ref={canvasRef} className="hidden" />
      <div className="flex flex-col gap-3 sm:flex-row">
        {!cameraReady ? (
          <Button type="button" onClick={startCamera} className="w-full sm:w-auto">
            <Camera className="h-4 w-4" /> Turn On Camera
          </Button>
        ) : (
          <Button type="button" variant="outline" onClick={stopCamera} className="w-full sm:w-auto">
            <Square className="h-4 w-4" /> Stop Camera
          </Button>
        )}
        {mode === "attendance" && loopActive ? (
          <Button type="button" variant="destructive" onClick={stopAttendanceLoop} className="w-full sm:w-auto">
            <Square className="h-4 w-4" /> Stop Attendance Loop
          </Button>
        ) : null}
        <Button
          type="button"
          disabled={!cameraReady || loading || loopActive || (mode === "register" && (!studentId || !name))}
          onClick={submitCapture}
          className="w-full sm:w-auto"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanFace className="h-4 w-4" />}
          {mode === "register" ? "Register Face" : "Start Attendance Loop"}
        </Button>
      </div>
      <p className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
        {status}
      </p>
    </div>
  );
}
