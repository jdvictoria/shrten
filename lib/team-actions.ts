"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "./prisma";
import type { ActionResult } from "./actions";
import { nanoid } from "nanoid";

export async function getMyTeams() {
  const session = await auth();
  if (!session?.user?.id) return [];

  const memberships = await prisma.teamMember.findMany({
    where: { userId: session.user.id },
    include: {
      team: {
        include: {
          _count: { select: { members: true, links: true } },
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  });
  return memberships.map((m) => ({ ...m.team, role: m.role }));
}

export async function createTeam(
  name: string
): Promise<ActionResult<{ id: string; slug: string }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };
  if (!name.trim()) return { success: false, error: "Name is required" };

  const slug =
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") +
    "-" +
    nanoid(4);

  try {
    const team = await prisma.team.create({
      data: {
        name: name.trim(),
        slug,
        members: { create: { userId: session.user.id, role: "admin" } },
      },
    });
    revalidatePath("/dashboard/teams");
    return { success: true, data: { id: team.id, slug: team.slug } };
  } catch {
    return { success: false, error: "Failed to create team" };
  }
}

export async function getTeam(id: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const membership = await prisma.teamMember.findFirst({
    where: { teamId: id, userId: session.user.id },
  });
  if (!membership) return null;

  return prisma.team.findUnique({
    where: { id },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
        orderBy: { joinedAt: "asc" },
      },
      invitations: { orderBy: { createdAt: "desc" } },
      _count: { select: { links: true } },
    },
  });
}

export async function inviteMember(
  teamId: string,
  email: string,
  role: "admin" | "editor" | "viewer" = "editor"
): Promise<ActionResult<{ token: string }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  // Must be admin
  const membership = await prisma.teamMember.findFirst({
    where: { teamId, userId: session.user.id, role: "admin" },
  });
  if (!membership) return { success: false, error: "Only admins can invite members" };

  try {
    const inv = await prisma.teamInvitation.create({
      data: {
        teamId,
        email: email.trim().toLowerCase(),
        role,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });
    return { success: true, data: { token: inv.token } };
  } catch {
    return { success: false, error: "Failed to create invitation" };
  }
}

export async function acceptInvitation(
  token: string
): Promise<ActionResult<{ teamId: string }>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const inv = await prisma.teamInvitation.findUnique({ where: { token } });
  if (!inv) return { success: false, error: "Invalid invitation" };
  if (inv.expiresAt < new Date()) return { success: false, error: "Invitation expired" };

  try {
    await prisma.teamMember.upsert({
      where: { teamId_userId: { teamId: inv.teamId, userId: session.user.id } },
      update: { role: inv.role },
      create: { teamId: inv.teamId, userId: session.user.id, role: inv.role },
    });
    await prisma.teamInvitation.delete({ where: { token } });
    revalidatePath("/dashboard/teams");
    return { success: true, data: { teamId: inv.teamId } };
  } catch {
    return { success: false, error: "Failed to accept invitation" };
  }
}

export async function updateMemberRole(
  teamId: string,
  memberId: string,
  role: "admin" | "editor" | "viewer"
): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const myMembership = await prisma.teamMember.findFirst({
    where: { teamId, userId: session.user.id, role: "admin" },
  });
  if (!myMembership) return { success: false, error: "Only admins can change roles" };

  await prisma.teamMember.update({ where: { id: memberId }, data: { role } });
  revalidatePath(`/dashboard/teams/${teamId}`);
  return { success: true, data: undefined };
}

export async function removeMember(
  teamId: string,
  memberId: string
): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const myMembership = await prisma.teamMember.findFirst({
    where: { teamId, userId: session.user.id, role: "admin" },
  });
  if (!myMembership) return { success: false, error: "Only admins can remove members" };

  await prisma.teamMember.delete({ where: { id: memberId } });
  revalidatePath(`/dashboard/teams/${teamId}`);
  return { success: true, data: undefined };
}

export async function getTeamLinks(teamId: string) {
  const session = await auth();
  if (!session?.user?.id) return [];

  const membership = await prisma.teamMember.findFirst({
    where: { teamId, userId: session.user.id },
  });
  if (!membership) return [];

  return prisma.link.findMany({
    where: { teamId, isArchived: false },
    orderBy: { createdAt: "desc" },
    include: {
      tags: { include: { tag: true } },
      folder: true,
      user: { select: { name: true, email: true, image: true } },
    },
  });
}

export async function getMyRole(teamId: string): Promise<"admin" | "editor" | "viewer" | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const membership = await prisma.teamMember.findFirst({
    where: { teamId, userId: session.user.id },
    select: { role: true },
  });
  return membership?.role ?? null;
}
