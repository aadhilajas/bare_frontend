# Bare CRM — Frontend

React + Vite UI for **Bare**, an AI-native mini CRM for a fictional skincare D2C brand.

> **Repository note:** Published as **`bare_frontend`** on GitHub (this `frontend/` folder is the repo root). For local full-stack work, the backend lives alongside this folder in the parent monorepo.

## Stack

| Layer | Technology |
|---|---|
| UI | React 18 + TypeScript |
| Build | Vite 5 |
| Styling | Tailwind CSS |
| Routing | React Router v6 |

## Prerequisites

- Node.js 18+
- npm
- CRM backend on port 8000 (and channel-stub on 8001 for local campaign delivery)

## Local development

From this directory:

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

The Vite dev server proxies `/api` to `http://localhost:8000` by default (`vite.config.ts`). All API calls go through `src/api/client.ts`.

Optional: create `.env.local` only if you need a non-default backend URL at build time:

```bash
# .env.local — do not commit
VITE_CRM_API_URL=http://localhost:8000
```

Do **not** copy `.env.example` verbatim into `.env.local` — it is a template with commented placeholders only.

## Environment variables

| Variable | Required | Default behavior | Description |
|---|---|---|---|
| `VITE_CRM_API_URL` | No | Dev: `/api` via Vite proxy; Prod: Railway fallback in `client.ts` if unset at build | Backend base URL without `/api` suffix |

### API URL resolution (`src/api/client.ts`)

1. `VITE_CRM_API_URL` when set at build time → `{url}/api`
2. Local dev (`localhost` / `127.0.0.1`) → `/api` (Vite proxy)
3. Production without env → hardcoded Railway backend fallback

Set `VITE_CRM_API_URL` in Vercel project settings for production builds.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server on port 5173 |
| `npm run build` | Type-check and build for production → `dist/` |
| `npm run preview` | Preview production build (uses same `/api` proxy as dev) |

## Production build

```bash
npm ci
VITE_CRM_API_URL=https://your-backend.example.com npm run build
```

Serve `dist/` with any static host (Vercel, Netlify, Nginx, etc.).

### Docker

```bash
docker build \
  --build-arg VITE_CRM_API_URL=https://your-backend.example.com \
  -t bare-frontend .

docker run -p 8080:80 bare-frontend
```

Open `http://localhost:8080`. The API URL must be supplied at **build** time via `VITE_CRM_API_URL`.

## Pages

| Route | Page |
|---|---|
| `/` | Dashboard |
| `/customers` | Customer list |
| `/customers/:id` | Customer detail |
| `/segments` | Segment list and builder |
| `/segments/:id` | Segment detail |
| `/campaigns` | Campaign list and creator |
| `/campaigns/:id` | Campaign detail with live delivery stats |
| `/analytics` | Aggregate delivery analytics |

## Project structure

```
src/
├── api/           # Typed API client (single entry: client.ts)
├── components/    # Shared UI components
├── copilot/       # AI co-pilot context and hooks
├── hooks/         # useFetch, usePolling, useSegmentPreview, usePageTitle
├── lib/           # Utilities (formatting, cn)
└── pages/         # Route-level page components
```
