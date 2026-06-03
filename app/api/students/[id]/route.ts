import { NextResponse } from "next/server";

import { databaseNotConfiguredResponse, isDatabaseConfigured } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { invalidateStudentCandidates } from "@/lib/student-candidates-cache";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, context: RouteContext) {
  if (!isDatabaseConfigured()) {
    return databaseNotConfiguredResponse();
  }

  const { id } = await context.params;
  const body = (await request.json()) as { name?: string };
  const name = String(body.name ?? "").trim();

  if (!name) {
    return NextResponse.json({ error: "Student name is required." }, { status: 400 });
  }

  await prisma.student.update({
    where: { studentId: id },
    data: { name },
  });

  invalidateStudentCandidates();

  return NextResponse.json({ status: "UPDATED" });
}

export async function DELETE(_request: Request, context: RouteContext) {
  if (!isDatabaseConfigured()) {
    return databaseNotConfiguredResponse();
  }

  const { id } = await context.params;

  await prisma.attendance.deleteMany({
    where: { studentId: id },
  });
  await prisma.student.delete({
    where: { studentId: id },
  });

  invalidateStudentCandidates();

  return NextResponse.json({ status: "DELETED" });
}
