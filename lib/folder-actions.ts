"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "./prisma";
import type { ActionResult } from "./actions";

export async function getFolders() {
  const session = await auth();
  if (!session?.user?.id) return [];
  return prisma.folder.findMany({
    where: { userId: session.user.id },
    orderBy: { name: "asc" },
    include: { _count: { select: { links: true } } },
  });
}

export async function createFolder(
  name: string,
  color = "#06b6d4"
): Promise<ActionResult<{ id: string; name: string }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };
  if (!name.trim()) return { success: false, error: "Name is required" };

  try {
    const folder = await prisma.folder.create({
      data: { name: name.trim(), color, userId: session.user.id },
    });
    revalidatePath("/dashboard");
    return { success: true, data: { id: folder.id, name: folder.name } };
  } catch {
    return { success: false, error: "Failed to create folder" };
  }
}

export async function deleteFolder(id: string): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  try {
    await prisma.folder.deleteMany({ where: { id, userId: session.user.id } });
    revalidatePath("/dashboard");
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Failed to delete folder" };
  }
}
