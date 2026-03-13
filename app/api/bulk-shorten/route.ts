import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redis, LINK_TTL, type CachedLink } from "@/lib/redis";
import { rateLimit } from "@/lib/rate-limit";
import { getBaseUrl } from "@/lib/utils";

const SLUG_REGEX = /^[a-zA-Z0-9_-]+$/;

/**
 * POST /api/bulk-shorten
 *
 * Used by the bulk CSV upload UI. Each row is sent as a separate request.
 * Rate limit: 50 per minute per IP.
 */
export async function POST(request: Request) {
  const session = await auth();
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "anon";

  const rl = await rateLimit(`bulk:${ip}`, { limit: 50, windowSec: 60 });
  if (!rl.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  let body: { url?: string; slug?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { url, slug: customSlug } = body;

  if (!url?.trim()) return NextResponse.json({ error: "url required" }, { status: 400 });
  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 422 });
  }

  let slug: string;
  if (customSlug?.trim()) {
    slug = customSlug.trim();
    if (!SLUG_REGEX.test(slug) || slug.length < 2 || slug.length > 50) {
      return NextResponse.json({ error: "Invalid slug" }, { status: 422 });
    }
    const existing = await prisma.link.findUnique({ where: { slug }, select: { id: true } });
    if (existing) return NextResponse.json({ error: "Slug already taken" }, { status: 409 });
  } else {
    slug = nanoid(7);
  }

  const link = await prisma.link.create({
    data: { slug, url: url.trim(), userId: session?.user?.id ?? null },
  });

  const cached: CachedLink = {
    id: link.id,
    url: link.url,
    expiresAt: null,
    hasPassword: false,
    isActive: true,
    geoRules: [],
  };
  await redis.set(`link:${slug}`, cached, { ex: LINK_TTL });

  return NextResponse.json(
    { id: link.id, slug: link.slug, shortUrl: `${getBaseUrl(request)}/${link.slug}`, url: link.url },
    { status: 201 }
  );
}
