import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { getBaseUrl } from "@/lib/utils";

/**
 * DELETE /api/links/:id
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const link = await prisma.link.delete({ where: { id } });
    await redis.del(`link:${link.slug}`);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Link not found" }, { status: 404 });
  }
}

/**
 * GET /api/links/:id
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const link = await prisma.link.findUnique({ where: { id } });
  if (!link) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ...link, shortUrl: `${getBaseUrl(request)}/${link.slug}` });
}
