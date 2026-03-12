import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SLUG_REGEX = /^[a-zA-Z0-9_-]+$/;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug")?.trim();

  if (!slug) {
    return NextResponse.json({ available: false, reason: "missing" }, { status: 400 });
  }
  if (!SLUG_REGEX.test(slug)) {
    return NextResponse.json({ available: false, reason: "invalid" });
  }
  if (slug.length < 2 || slug.length > 50) {
    return NextResponse.json({ available: false, reason: "length" });
  }

  const existing = await prisma.link.findUnique({ where: { slug }, select: { id: true } });
  return NextResponse.json({ available: !existing });
}
