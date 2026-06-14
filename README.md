# Bare CRM — Frontend

React + Vite UI for **Bare**, an AI-native mini CRM for a fictional skincare D2C brand.

> **Repository note:** This is the **frontend** repo. The FastAPI backend and channel-stub live in a separate repository. When pushing to GitHub, use the contents of this `frontend/` folder as the **repository root** (not the parent monorepo folder).

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
- A running CRM backend on port 8000 (see the backend repository)

## Local development

```bash
npm install
cp .env.example .env.local    # optional — only needed if backend is not on localhost:8000
npm run dev
```

Open `http://localhost:5173`.

The Vite dev server proxies `/api` requests to `http://localhost:8000` by default. Start the CRM backend and channel-stub before testing campaign send flows.

## Environment variables

Create `.env.local` (not committed) for local overrides:

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_CRM_API_URL` | No | *(empty — uses `/api` proxy)* | Backend base URL, e.g. `http://localhost:8000` |

In development, leaving this unset uses the Vite proxy defined in `vite.config.ts`.

For production builds, set `VITE_CRM_API_URL` to your deployed backend URL **at build time**:

```bash
VITE_CRM_API_URL=https://your-backend.example.com npm run build
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server on port 5173 |
| `npm run build` | Type-check and build for production → `dist/` |
| `npm run preview` | Preview the production build locally |

## Production build

```bash
npm ci
VITE_CRM_API_URL=https://your-backend.example.com npm run build
```

Serve the `dist/` folder with any static host (Vercel, Netlify, Nginx, S3 + CloudFront, etc.).

### Docker

```bash
docker build \
  --build-arg VITE_CRM_API_URL=https://your-backend.example.com \
  -t bare-frontend .

docker run -p 8080:80 bare-frontend
```

Open `http://localhost:8080`.

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
├── api/           # Typed API client modules
├── components/    # Shared UI components
├── copilot/       # AI co-pilot context and hooks
├── hooks/         # useFetch, usePolling, useSegmentPreview, usePageTitle
├── lib/           # Utilities (formatting, cn)
└── pages/         # Route-level page components
```

## Pushing to GitHub

Copy this folder's contents to a new directory (or push from here directly):

```bash
cd frontend
git init
git add .
git commit -m "Initial frontend submission"
git remote add origin https://github.com/<you>/bare-frontend.git
git push -u origin main
```

Do **not** include `node_modules/`, `dist/`, or `.env.local`.
