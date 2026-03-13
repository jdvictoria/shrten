import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { redis, LINK_TTL, type CachedLink } from "@/lib/redis";
import { parseUA } from "@/lib/ua-parser";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // ── 1. Redis cache (serves 99% of requests without a DB query) ────────────
  let cached = await redis.get<CachedLink>(`link:${slug}`);

  if (!cached) {
    // ── 2. Cache miss — fetch full link data ─────────────────────────────────
    const link = await prisma.link.findUnique({
      where: { slug },
      select: {
        id: true,
        url: true,
        expiresAt: true,
        passwordHash: true,
        isActive: true,
        geoRules: { select: { country: true, url: true } },
      },
    });

    if (!link) {
      return NextResponse.redirect(new URL("/not-found", request.url));
    }

    cached = {
      id: link.id,
      url: link.url,
      expiresAt: link.expiresAt?.toISOString() ?? null,
      hasPassword: !!link.passwordHash,
      isActive: link.isActive,
      geoRules: link.geoRules,
    };
    await redis.set(`link:${slug}`, cached, { ex: LINK_TTL });
  }

  // ── 3. Active check ───────────────────────────────────────────────────────
  if (cached.isActive === false) {
    return NextResponse.redirect(new URL("/not-found", request.url));
  }

  // ── 4. Expiry check ───────────────────────────────────────────────────────
  if (cached.expiresAt && new Date(cached.expiresAt) < new Date()) {
    await redis.del(`link:${slug}`); // evict stale entry
    return NextResponse.redirect(new URL("/link-expired", request.url));
  }

  // ── 5. Password gate ──────────────────────────────────────────────────────
  if (cached.hasPassword) {
    const cookieStore = await cookies();
    if (!cookieStore.get(`pw_${slug}`)) {
      return NextResponse.redirect(new URL(`/pw/${slug}`, request.url));
    }
  }

  // ── 6. Geographic redirect ────────────────────────────────────────────────
  let url = cached.url;
  if (cached.geoRules.length > 0) {
    const country = request.headers.get("x-vercel-ip-country"); // free on Vercel
    if (country) {
      const rule = cached.geoRules.find((r) => r.country === country);
      if (rule) url = rule.url;
    }
  }

  // ── 7. Analytics (fire-and-forget — never blocks the redirect) ────────────
  const ua = request.headers.get("user-agent") ?? "";
  const { device, browser, os } = parseUA(ua);
  const country = request.headers.get("x-vercel-ip-country") ?? undefined;
  const referer = request.headers.get("referer") ?? undefined;

  void Promise.all([
    prisma.link.update({ where: { slug }, data: { clicks: { increment: 1 } } }),
    prisma.clickEvent.create({
      data: { linkId: cached.id, referer, country, device, browser, os },
    }),
  ]).catch(() => {});

  return NextResponse.redirect(url, { status: 302 });
}
