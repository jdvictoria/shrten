"use server";

import { revalidatePath } from "next/cache";
import { headers, cookies } from "next/headers";
import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "./prisma";
import { redis, LINK_TTL, type CachedLink } from "./redis";
import { rateLimit } from "./rate-limit";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export type GeoRule = { country: string; url: string };

const SLUG_REGEX = /^[a-zA-Z0-9_-]+$/;

// ─── Shorten ─────────────────────────────────────────────────────────────────

export async function shortenUrl(
  url: string,
  customSlug?: string,
  expiresAt?: string,
  password?: string,
  geoRules?: GeoRule[]
): Promise<ActionResult<{ id: string; slug: string; url: string; expiresAt: Date | null }>> {
  // Rate limit per IP
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0].trim() ?? "anon";
  const rl = await rateLimit(`shorten:${ip}`, { limit: 10, windowSec: 60 });
  if (!rl.success) {
    return { success: false, error: "Too many requests. Please wait a minute." };
  }

  if (!url?.trim()) return { success: false, error: "URL is required" };
  try {
    new URL(url);
  } catch {
    return { success: false, error: "Please enter a valid URL" };
  }

  // Resolve slug
  let slug: string;
  if (customSlug?.trim()) {
    slug = customSlug.trim();
    if (!SLUG_REGEX.test(slug)) {
      return { success: false, error: "Alias may only contain letters, numbers, - and _" };
    }
    if (slug.length < 2 || slug.length > 50) {
      return { success: false, error: "Alias must be 2–50 characters" };
    }
    const existing = await prisma.link.findUnique({ where: { slug } });
    if (existing) return { success: false, error: "That alias is already taken" };
  } else {
    slug = nanoid(7);
  }

  const expiry = expiresAt ? new Date(expiresAt) : null;
  if (expiry && expiry <= new Date()) {
    return { success: false, error: "Expiration date must be in the future" };
  }

  const session = await auth();
  const userId = session?.user?.id ?? null;
  const passwordHash = password?.trim() ? await bcrypt.hash(password.trim(), 12) : null;
  const validGeoRules = (geoRules ?? []).filter((r) => r.country && r.url);

  try {
    const link = await prisma.link.create({
      data: {
        slug,
        url: url.trim(),
        expiresAt: expiry,
        passwordHash,
        userId,
        geoRules: validGeoRules.length
          ? { create: validGeoRules }
          : undefined,
      },
    });

    // Cache full link data so redirects never need a DB round-trip
    const cached: CachedLink = {
      id: link.id,
      url: link.url,
      expiresAt: link.expiresAt?.toISOString() ?? null,
      hasPassword: !!passwordHash,
      geoRules: validGeoRules,
    };
    await redis.set(`link:${slug}`, cached, { ex: LINK_TTL });

    revalidatePath("/");
    revalidatePath("/dashboard");

    return { success: true, data: { id: link.id, slug: link.slug, url: link.url, expiresAt: link.expiresAt } };
  } catch {
    return { success: false, error: "Failed to create short URL. Please try again." };
  }
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getLinks() {
  const session = await auth();
  if (!session?.user?.id) return [];

  return prisma.link.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
}

export async function getStats() {
  const session = await auth();
  if (!session?.user?.id) return { totalLinks: 0, totalClicks: 0 };

  const [totalLinks, aggregate] = await Promise.all([
    prisma.link.count({ where: { userId: session.user.id } }),
    prisma.link.aggregate({
      where: { userId: session.user.id },
      _sum: { clicks: true },
    }),
  ]);

  return { totalLinks, totalClicks: aggregate._sum.clicks ?? 0 };
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export async function getLinkAnalytics(id: string, days = 30) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const link = await prisma.link.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!link) return null;

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const events = await prisma.clickEvent.findMany({
    where: { linkId: id, createdAt: { gte: since } },
    select: { createdAt: true, referer: true, country: true, device: true, browser: true, os: true },
    orderBy: { createdAt: "asc" },
  });

  // ── Clicks by day (pre-filled, no gaps) ──────────────────────────────────
  const byDay: Record<string, number> = {};
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    byDay[d.toISOString().split("T")[0]] = 0;
  }
  for (const e of events) {
    const day = e.createdAt.toISOString().split("T")[0];
    byDay[day] = (byDay[day] ?? 0) + 1;
  }
  const clicksByDay = Object.entries(byDay).map(([date, clicks]) => ({ date, clicks }));

  // ── Aggregation helpers ───────────────────────────────────────────────────
  function topN<T extends string>(
    arr: (T | null | undefined)[],
    n = 5,
    fallback = "Unknown"
  ) {
    const map: Record<string, number> = {};
    for (const v of arr) map[v ?? fallback] = (map[v ?? fallback] ?? 0) + 1;
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([name, count]) => ({ name, count }));
  }

  const topReferers = topN(events.map((e) => e.referer ?? "Direct"), 5, "Direct");
  const topCountries = topN(events.map((e) => e.country), 10, "Unknown");
  const deviceStats = topN(events.map((e) => e.device), 5, "desktop");
  const browserStats = topN(events.map((e) => e.browser), 5, "Other");
  const osStats = topN(events.map((e) => e.os), 5, "Other");

  return {
    link,
    clicksByDay,
    topReferers,
    topCountries,
    deviceStats,
    browserStats,
    osStats,
    totalInPeriod: events.length,
  };
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function deleteLink(id: string): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  try {
    const link = await prisma.link.delete({
      where: { id, userId: session.user.id },
    });
    await redis.del(`link:${link.slug}`);
    revalidatePath("/");
    revalidatePath("/dashboard");
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Failed to delete link" };
  }
}

export async function checkSlugAvailability(
  slug: string
): Promise<{ available: boolean; reason?: string }> {
  if (!SLUG_REGEX.test(slug)) return { available: false, reason: "invalid" };
  if (slug.length < 2 || slug.length > 50) return { available: false, reason: "length" };
  const existing = await prisma.link.findUnique({ where: { slug } });
  return { available: !existing };
}

export async function verifyLinkPassword(
  slug: string,
  password: string
): Promise<ActionResult<void>> {
  const link = await prisma.link.findUnique({
    where: { slug },
    select: { passwordHash: true },
  });
  if (!link?.passwordHash) return { success: false, error: "Invalid link" };

  const valid = await bcrypt.compare(password, link.passwordHash);
  if (!valid) return { success: false, error: "Incorrect password" };

  const cookieStore = await cookies();
  cookieStore.set(`pw_${slug}`, "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours
  });

  return { success: true, data: undefined };
}
