import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export const LINKS_PAGE_SIZE = 2;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Client components: returns window.location.origin on the browser.
// Server-side SSR fallback uses Vercel's built-in env vars (no config needed).
export function getAppUrl(): string {
  if (typeof window !== "undefined") return window.location.origin;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

// Route handlers: derives base URL from the incoming Request headers.
// Works correctly on Vercel (x-forwarded-host = custom domain) and locally.
export function getBaseUrl(req: Request): string {
  const host =
    req.headers.get("x-forwarded-host") ??
    req.headers.get("host") ??
    "localhost:3000";
  const proto =
    req.headers.get("x-forwarded-proto")?.split(",")[0] ?? "http";
  return `${proto}://${host}`;
}
