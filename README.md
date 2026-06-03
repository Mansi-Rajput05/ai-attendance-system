# AI Attendance System

Modern face recognition attendance system split into a Next.js App Router frontend and a FastAPI recognition backend.

## Structure

- `app/` - Next.js App Router frontend for Vercel.
- `components/` - shadcn-style UI components and page clients.
- `lib/` - Prisma, Redis, and recognition API helpers.
- `prisma/schema.prisma` - MongoDB Prisma schema using `DATABASE_URL`.
- `recognition-api/` - FastAPI recognition backend for Railway.

## Frontend: Vercel

Install and run from the repository root:

```bash
npm install
npm run dev
```

Required Vercel environment variables:

- `NEXT_PUBLIC_RECOGNITION_API_URL` - deployed Railway FastAPI URL.
- `RECOGNITION_API_URL` - same Railway URL for server-side proxy calls.
- `DATABASE_URL` - MongoDB connection string for Prisma.
- `REDIS_URL` - optional Redis connection string for cached read endpoints.

Build checks:

```bash
npm run typecheck
npm run build
npm run prisma:generate
npm run prisma:validate
```

## Backend: Railway

Deploy the `recognition-api/` folder as the Railway service root.

Railway start command:

```bash
uvicorn api:app --host 0.0.0.0 --port $PORT
```

Recommended Railway environment variables:

- `FRONTEND_URL` - deployed Vercel URL, for example `https://your-app.vercel.app`.

Local backend run:

```bash
cd recognition-api
pip install -r requirements.txt
uvicorn api:app --reload
```

## Notes

- Live recognition requests are not cached because they can mark attendance.
- Student list, attendance records, and dashboard stats are cached briefly through Redis when `REDIS_URL` is available.
- Prisma is pinned to `6.19.0` because direct MongoDB `DATABASE_URL` support is required for this project.
