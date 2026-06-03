# Next.js + Recognition API Revamp Plan

## Phase 1: Repository Audit - Done

- Confirmed the current frontend is a Vite React app in `frontend/`.
- Confirmed the FastAPI recognition backend lives at the repository root and exposes the existing attendance endpoints.
- Preserved the endpoint contract for scan, register, students, attendance, CSV download, and dashboard stats.

## Phase 2: Next.js Application Shell - Done

- Replace the Vite frontend with a root-level Next.js TypeScript application.
- Add app router structure, global layout, responsive navigation, loading page, not-found page, and global error handling.
- Add `next-themes` support with a purple professional mono-theme design language.

## Phase 3: shadcn UI System - Done

- Add shadcn-style UI primitives under `components/ui`.
- Use these primitives for buttons, cards, inputs, badges, tables, skeleton states, and page composition.
- Keep styling responsive and accessible.

## Phase 4: Core Feature Migration - Done

- Migrate the dashboard live scan flow to Next.js.
- Migrate student registration with webcam frame capture.
- Migrate attendance search, reset, and CSV download.
- Migrate student list search, edit, and delete flows.

## Phase 5: FastAPI Railway Boundary - Done

- Keep the recognition API separated for Railway deployment.
- Configure the Next.js app to call the Railway API through `NEXT_PUBLIC_RECOGNITION_API_URL`.
- Add backend deployment metadata and dependency files where needed.

## Phase 6: MongoDB + Prisma - Done

- Add Prisma configured for MongoDB using `DATABASE_URL`.
- Add schema models for users, attendance records, recognition events, and app audit metadata.
- Add a reusable Prisma client helper.

## Phase 7: Redis Caching - Done

- Add optional Redis client support using `REDIS_URL`.
- Cache low-risk read-heavy data such as dashboard stats, student lists, and attendance queries where practical.
- Keep recognition API calls uncached by default because live recognition has side effects by marking attendance.

## Phase 8: Verification - Done

- Run dependency installation.
- Run Prisma validation/generation.
- Run TypeScript and Next.js production build.
- Run Python import/syntax checks where feasible.

## Phase 9: Commit - Done

- Review the diff.
- Commit only the intended migration files after successful verification.
