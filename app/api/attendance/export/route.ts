import { NextResponse } from "next/server";

import { databaseNotConfiguredResponse, isDatabaseConfigured } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return databaseNotConfiguredResponse();
  }

  const records = await prisma.attendance.findMany({
    orderBy: { createdAt: "desc" },
  });
  const rows = [
    ["Student ID", "Name", "Date", "Time"],
    ...records.map((record) => [record.studentId, record.studentName, record.date, record.time]),
  ];
  const csv = rows.map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(",")).join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv;charset=utf-8",
      "Content-Disposition": 'attachment; filename="attendance_report.csv"',
    },
  });
}
