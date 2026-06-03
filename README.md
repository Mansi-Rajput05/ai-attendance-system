# FaceTrace AI

Modern AI face recognition attendance system split into a Next.js App Router frontend and a FastAPI recognition backend.

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

For your current deployment, set these in Vercel:

```env
RECOGNITION_API_URL=https://ai-attendance-system-production.up.railway.app
NEXT_PUBLIC_RECOGNITION_API_URL=https://ai-attendance-system-production.up.railway.app
DATABASE_URL=your_mongodb_connection_string
```

Do not add `:8080` to the Railway public URL in Vercel. Railway maps the public HTTPS URL to the internal `$PORT` automatically.

Build checks:

```bash
npm run typecheck
npm run build
npm run prisma:generate
npm run prisma:validate
```

## Backend: Railway

Deploy the `recognition-api/` folder as the Railway service root.

Railway is configured to use `recognition-api/Dockerfile`. The image installs the Linux runtime libraries OpenCV needs, including `libxcb1`.

Dockerfile start command:

```bash
uvicorn api:app --host 0.0.0.0 --port ${PORT:-8080}
```

Do not set a Railway UI start command to `uvicorn api:app --host 0.0.0.0 --port $PORT`. In Docker deployments Railway can pass `$PORT` literally. Leave the Railway UI start command empty so the Dockerfile `CMD` is used.

Recommended Railway environment variables:

- `FRONTEND_URL` - deployed Vercel URL, for example `https://facemark-ai.vercel.app`.
- `NIXPACKS_PYTHON_VERSION` - set to `3.11` for better ML dependency compatibility.

For your current deployment, set these in Railway:

```env
FRONTEND_URL=https://facemark-ai.vercel.app
NIXPACKS_PYTHON_VERSION=3.11
```

Railway provides `PORT` automatically. The Dockerfile expands it through `sh -c` and falls back to `8080` locally.

Local backend run:

```bash
cd recognition-api
pip install -r requirements.txt
uvicorn api:app --reload
```

On Windows PowerShell, use the included runner so `uvicorn` does not need to be installed globally:

```powershell
cd recognition-api
powershell -ExecutionPolicy Bypass -File .\run-server.ps1
```

After the first run, you can skip dependency installation:

```powershell
powershell -ExecutionPolicy Bypass -File .\run-server.ps1 -SkipInstall
```

## Notes

- Live recognition requests are not cached because they can mark attendance.
- Student list, attendance records, and dashboard stats are cached briefly through Redis when `REDIS_URL` is available.
- Prisma is pinned to `6.19.0` because direct MongoDB `DATABASE_URL` support is required for this project.
- The Railway backend uses pinned `opencv-python-headless` and a Dockerfile because server deployments do not provide OpenCV runtime libraries by default.
- If Railway still reports `ImportError: libxcb.so.1`, confirm the Railway service root is `recognition-api/`, deploys the latest `main` commit, and rebuild with the build cache cleared.
- InsightFace loads only detection and recognition modules on Railway to reduce memory use. If Railway logs show `Killed`, increase Railway memory or lower `INSIGHTFACE_DET_SIZE` to `256`.
