import { NextRequest, NextResponse } from "next/server";

import { databaseNotConfiguredResponse, isDatabaseConfigured } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return databaseNotConfiguredResponse();
  }

  const studentId = request.nextUrl.searchParams.get("student_id") ?? undefined;
  const date = request.nextUrl.searchParams.get("date") ?? undefined;

  const records = await prisma.attendance.findMany({
    where: {
      ...(studentId ? { studentId } : {}),
      ...(date ? { date } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    records.map((record) => ({
      id: record.id,
      student_id: Number(record.studentId),
      name: record.studentName,
      date: record.date,
      time: record.time,
    })),
  );
}

export async function DELETE(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return databaseNotConfiguredResponse();
  }

  const id = request.nextUrl.searchParams.get("id") ?? undefined;
  const studentId = request.nextUrl.searchParams.get("student_id") ?? undefined;
  const date = request.nextUrl.searchParams.get("date") ?? undefined;

  if (id) {
    await prisma.attendance.delete({
      where: { id },
    });

    return NextResponse.json({ status: "DELETED" });
  }

  const result = await prisma.attendance.deleteMany({
    where: {
      ...(studentId ? { studentId } : {}),
      ...(date ? { date } : {}),
    },
  });

  return NextResponse.json({
    status: "CLEARED",
    count: result.count,
  });
}
