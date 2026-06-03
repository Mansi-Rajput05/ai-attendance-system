import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getRedis } from "@/lib/redis";

export async function GET() {
  const checks = {
    app: "ok",
    prisma: "skipped",
    redis: "skipped",
    recognitionApi: "skipped",
  };

  if (process.env.DATABASE_URL) {
    try {
      await prisma.$runCommandRaw({ ping: 1 });
      checks.prisma = "ok";
    } catch {
      checks.prisma = "error";
    }
  }

  const redis = getRedis();

  if (redis) {
    try {
      await redis.ping();
      checks.redis = "ok";
    } catch {
      checks.redis = "error";
    }
  }

  const baseUrl = process.env.RECOGNITION_API_URL ?? process.env.NEXT_PUBLIC_RECOGNITION_API_URL;

  if (baseUrl) {
    try {
      const response = await fetch(baseUrl, { cache: "no-store" });
      checks.recognitionApi = response.ok ? "ok" : "error";
    } catch {
      checks.recognitionApi = "error";
    }
  }

  return NextResponse.json(checks);
}
