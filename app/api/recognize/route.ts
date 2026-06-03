import { NextResponse } from "next/server";

import { databaseNotConfiguredResponse, isDatabaseConfigured } from "@/lib/api-response";
import { recognitionApiUrl } from "@/lib/config";
import { getTodayParts } from "@/lib/date";
import { prisma } from "@/lib/prisma";
import { getStudentCandidates } from "@/lib/student-candidates-cache";

type RecognizePayload = {
  frames?: string[];
};

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return databaseNotConfiguredResponse();
  }

  const body = (await request.json()) as RecognizePayload;
  const frames = Array.isArray(body.frames) ? body.frames : [];

  if (frames.length === 0) {
    return NextResponse.json({ error: "At least one camera frame is required." }, { status: 400 });
  }

  const candidates = await getStudentCandidates();

  if (candidates.length === 0) {
    return NextResponse.json({ status: "NO_REGISTERED_STUDENTS", message: "No registered students found." });
  }

  const recognitionResponse = await fetch(`${recognitionApiUrl}/recognize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ frames, candidates }),
    cache: "no-store",
  });
  const recognitionResult = await recognitionResponse.json();

  if (!recognitionResponse.ok || recognitionResult.status !== "REAL_FACE") {
    return NextResponse.json({
      status: recognitionResult.status || "UNKNOWN_FACE",
      message: recognitionResult.message || recognitionResult.detail || recognitionResult.status || "Face not recognized.",
    });
  }

  const studentId = String(recognitionResult.studentId ?? recognitionResult.student_id);
  const name = String(recognitionResult.name ?? "");
  const { date, time } = getTodayParts();

  try {
    await prisma.attendance.create({
      data: {
        studentId,
        studentName: name,
        date,
        time,
      },
    });

    return NextResponse.json({
      status: "REAL_FACE",
      name,
      student_id: Number(studentId),
      attendance_status: "MARKED",
      message: `Attendance marked for ${name}.`,
    });
  } catch {
    return NextResponse.json({
      status: "REAL_FACE",
      name,
      student_id: Number(studentId),
      attendance_status: "ALREADY_MARKED",
      message: `${name} is already marked present today.`,
    });
  }
}
