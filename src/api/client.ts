/// <reference types="vite/client" />

const DEFAULT_PRODUCTION_API = "https://barebackend-production.up.railway.app";

function isLocalDev(): boolean {
  if (import.meta.env.DEV) return true;
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    return host === "localhost" || host === "127.0.0.1";
  }
  return false;
}

function resolveBaseUrl(): string {
  const envUrl = import.meta.env.VITE_CRM_API_URL?.trim().replace(/\/$/, "");
  if (envUrl) return `${envUrl}/api`;
  if (isLocalDev()) return "/api";
  return `${DEFAULT_PRODUCTION_API}/api`;
}

const BASE_URL = resolveBaseUrl();

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
};
