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
      student_id: Number(record.studentId),
      name: record.studentName,
      date: record.date,
      time: record.time,
    })),
  );
}
