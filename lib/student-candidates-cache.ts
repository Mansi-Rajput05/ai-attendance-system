import { prisma } from "@/lib/prisma";

type StudentCandidate = {
  studentId: string;
  name: string;
  embedding: number[];
};

type StudentCandidatesCache = {
  candidates: StudentCandidate[] | null;
  expiresAt: number;
  pending?: Promise<StudentCandidate[]>;
};

const CACHE_TTL_MS = 60_000;

const globalForStudentCandidates = globalThis as unknown as {
  studentCandidatesCache?: StudentCandidatesCache;
};

const cache =
  globalForStudentCandidates.studentCandidatesCache ??
  {
    candidates: null,
    expiresAt: 0,
  };

if (!globalForStudentCandidates.studentCandidatesCache) {
  globalForStudentCandidates.studentCandidatesCache = cache;
}

export async function getStudentCandidates() {
  const now = Date.now();

  if (cache.candidates && cache.expiresAt > now) {
    return cache.candidates;
  }

  if (cache.pending) {
    return cache.pending;
  }

  cache.pending = prisma.student
    .findMany({
      select: { studentId: true, name: true, embedding: true },
    })
    .then((candidates: StudentCandidate[]) => {
      cache.candidates = candidates;
      cache.expiresAt = Date.now() + CACHE_TTL_MS;
      return candidates;
    })
    .finally(() => {
      cache.pending = undefined;
    });

  return cache.pending;
}

export function invalidateStudentCandidates() {
  cache.candidates = null;
  cache.expiresAt = 0;
  cache.pending = undefined;
}
