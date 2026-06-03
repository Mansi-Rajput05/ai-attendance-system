import { NextResponse } from "next/server";

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export function databaseNotConfiguredResponse() {
  return NextResponse.json(
    {
      error: "DATABASE_URL is not configured. Add your MongoDB connection string, then restart the app.",
    },
    { status: 503 },
  );
}
