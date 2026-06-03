import { NextResponse } from "next/server";

import { databaseNotConfiguredResponse, isDatabaseConfigured } from "@/lib/api-response";
import { recognitionApiUrl } from "@/lib/config";
import { prisma } from "@/lib/prisma";
import { invalidateStudentCandidates } from "@/lib/student-candidates-cache";

type CreateStudentPayload = {
  studentId?: string | number;
  student_id?: string | number;
  name?: string;
  frames?: string[];
};

export async function GET() {
  if (!isDatabaseConfigured()) {
    return databaseNotConfiguredResponse();
  }

  const students = await prisma.student.findMany({
    orderBy: { createdAt: "desc" },
    select: { studentId: true, name: true },
  });

  return NextResponse.json(
    students.map((student) => ({
      student_id: Number(student.studentId),
      name: student.name,
    })),
  );
}

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return databaseNotConfiguredResponse();
  }

  const body = (await request.json()) as CreateStudentPayload;
  const studentId = String(body.studentId ?? body.student_id ?? "").trim();
  const name = String(body.name ?? "").trim();
  const frames = Array.isArray(body.frames) ? body.frames : [];

  if (!studentId || !name || frames.length < 3) {
    return NextResponse.json({ error: "Student ID, name, and at least 3 frames are required." }, { status: 400 });
  }

  const existing = await prisma.student.findUnique({
    where: { studentId },
  });

  if (existing) {
    return NextResponse.json({ error: "Student already exists." }, { status: 409 });
  }

  const recognitionResponse = await fetch(`${recognitionApiUrl}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ frames }),
    cache: "no-store",
  });
  const recognitionResult = await recognitionResponse.json();

  if (!recognitionResponse.ok || recognitionResult.status !== "REGISTERED" || !Array.isArray(recognitionResult.embedding)) {
    return NextResponse.json(
      { error: recognitionResult.message || recognitionResult.status || "Face registration failed." },
      { status: 422 },
    );
  }

  const student = await prisma.student.create({
    data: {
      studentId,
      name,
      embedding: recognitionResult.embedding,
    },
    select: { studentId: true, name: true },
  });

  invalidateStudentCandidates();

  return NextResponse.json({
    status: "REGISTERED",
    message: "Student registered successfully.",
    student_id: Number(student.studentId),
    name: student.name,
  });
}
