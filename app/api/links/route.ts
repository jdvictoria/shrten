import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getBaseUrl } from "@/lib/utils";

/**
 * GET /api/links?page=1&limit=20
 *
 * Returns a paginated list of all links with stats.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));
  const skip = (page - 1) * limit;

  const [links, total] = await Promise.all([
    prisma.link.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        slug: true,
        url: true,
        clicks: true,
        expiresAt: true,
        createdAt: true,
      },
    }),
    prisma.link.count(),
  ]);

  const appUrl = getBaseUrl(request);

  return NextResponse.json({
    links: links.map((l) => ({ ...l, shortUrl: `${appUrl}/${l.slug}` })),
    meta: { total, page, limit, pages: Math.ceil(total / limit) },
  });
}
