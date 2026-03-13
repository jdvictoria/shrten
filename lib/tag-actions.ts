"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "./prisma";
import type { ActionResult } from "./actions";

export async function getTags() {
  const session = await auth();
  if (!session?.user?.id) return [];
  return prisma.tag.findMany({
    where: { userId: session.user.id },
    orderBy: { name: "asc" },
    include: { _count: { select: { links: true } } },
  });
}

export async function createTag(
  name: string,
  color = "#8b5cf6"
): Promise<ActionResult<{ id: string; name: string; color: string }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };
  if (!name.trim()) return { success: false, error: "Name is required" };

  try {
    const tag = await prisma.tag.create({
      data: { name: name.trim(), color, userId: session.user.id },
    });
    revalidatePath("/dashboard");
    return { success: true, data: { id: tag.id, name: tag.name, color: tag.color } };
  } catch {
    return { success: false, error: "Failed to create tag" };
  }
}

export async function deleteTag(id: string): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  try {
    await prisma.tag.deleteMany({ where: { id, userId: session.user.id } });
    revalidatePath("/dashboard");
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Failed to delete tag" };
  }
}
