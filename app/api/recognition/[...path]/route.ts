import { NextRequest } from "next/server";

import { invalidateCache, readCache, writeCache } from "@/lib/redis";

type RouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

const CACHEABLE_GET_PATHS = new Set(["dashboard-stats", "students", "attendance"]);
const CACHE_TTL_SECONDS = 20;

function recognitionBaseUrl() {
  return (
    process.env.RECOGNITION_API_URL ??
    process.env.NEXT_PUBLIC_RECOGNITION_API_URL ??
    "http://127.0.0.1:8000"
  ).replace(/\/$/, "");
}

function isCacheable(method: string, path: string) {
  return method === "GET" && CACHEABLE_GET_PATHS.has(path);
}

function buildTargetUrl(path: string, request: NextRequest) {
  const targetUrl = new URL(`${recognitionBaseUrl()}/${path}`);

  request.nextUrl.searchParams.forEach((value, key) => {
    targetUrl.searchParams.append(key, value);
  });

  return targetUrl;
}

async function proxy(request: NextRequest, context: RouteContext) {
  const { path: pathParts } = await context.params;
  const path = pathParts.join("/");
  const method = request.method;
  const targetUrl = buildTargetUrl(path, request);
  const cacheKey = `recognition-api:${path}:${targetUrl.searchParams.toString()}`;

  if (isCacheable(method, path)) {
    const cached = await readCache(cacheKey);

    if (cached) {
      return new Response(cached, {
        headers: {
          "Content-Type": "application/json",
          "X-Cache": "HIT",
        },
      });
    }
  }

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("connection");
  headers.delete("content-length");

  const response = await fetch(targetUrl, {
    method,
    headers,
    body: method === "GET" || method === "HEAD" ? undefined : await request.arrayBuffer(),
    cache: "no-store",
  });

  const responseHeaders = new Headers(response.headers);
  responseHeaders.set("X-Cache", "MISS");

  if (isCacheable(method, path) && response.ok) {
    const text = await response.text();
    await writeCache(cacheKey, text, CACHE_TTL_SECONDS);

    return new Response(text, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  }

  if (method !== "GET") {
    await invalidateCache("recognition-api:*");
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const DELETE = proxy;
