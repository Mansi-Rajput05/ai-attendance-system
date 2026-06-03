import { NextResponse } from "next/server";

import { databaseNotConfiguredResponse, isDatabaseConfigured } from "@/lib/api-response";
import { getTodayParts } from "@/lib/date";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return databaseNotConfiguredResponse();
  }

  const { date } = getTodayParts();
  const [totalStudents, todayAttendance] = await Promise.all([
    prisma.student.count(),
    prisma.attendance.count({ where: { date } }),
  ]);

  return NextResponse.json({
    total_students: totalStudents,
    today_attendance: todayAttendance,
  });
}
