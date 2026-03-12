import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";
import { redis, LINK_TTL } from "@/lib/redis";
import { rateLimit } from "@/lib/rate-limit";
import { getBaseUrl } from "@/lib/utils";

const SLUG_REGEX = /^[a-zA-Z0-9_-]+$/;

/**
 * POST /api/shorten
 *
 * Body: { url: string, slug?: string, expiresAt?: string (ISO 8601) }
 *
 * Returns: { id, slug, shortUrl, url, expiresAt }
 *
 * Rate limit: 10 req / min per IP
 */
export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "anon";
  const rl = await rateLimit(`api:shorten:${ip}`, { limit: 10, windowSec: 60 });

  if (!rl.success) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Retry after 60 seconds." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": "10",
          "X-RateLimit-Remaining": "0",
          "Retry-After": String(rl.reset),
        },
      }
    );
  }

  let body: { url?: string; slug?: string; expiresAt?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { url, slug: customSlug, expiresAt } = body;

  if (!url?.trim()) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }
  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL format" }, { status: 422 });
  }

  let slug: string;
  if (customSlug?.trim()) {
    slug = customSlug.trim();
    if (!SLUG_REGEX.test(slug) || slug.length < 2 || slug.length > 50) {
      return NextResponse.json(
        { error: "Slug must be 2–50 alphanumeric characters, dashes, or underscores" },
        { status: 422 }
      );
    }
    const existing = await prisma.link.findUnique({ where: { slug }, select: { id: true } });
    if (existing) {
      return NextResponse.json({ error: "Slug already taken" }, { status: 409 });
    }
  } else {
    slug = nanoid(7);
  }

  const expiry = expiresAt ? new Date(expiresAt) : null;
  if (expiry && expiry <= new Date()) {
    return NextResponse.json({ error: "expiresAt must be in the future" }, { status: 422 });
  }

  const link = await prisma.link.create({
    data: { slug, url: url.trim(), expiresAt: expiry },
  });

  await redis.set(`link:${slug}`, url.trim(), { ex: LINK_TTL });

  const appUrl = getBaseUrl(request);

  return NextResponse.json(
    {
      id: link.id,
      slug: link.slug,
      shortUrl: `${appUrl}/${link.slug}`,
      url: link.url,
      expiresAt: link.expiresAt,
      createdAt: link.createdAt,
    },
    { status: 201 }
  );
}
