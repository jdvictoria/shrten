"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

export async function signInWithCredentials(
  email: string,
  password: string,
  callbackUrl?: string
): Promise<{ error?: string }> {
  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: callbackUrl ?? "/dashboard",
    });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid email or password" };
        default:
          return { error: "Authentication failed. Please try again." };
      }
    }
    throw error; // re-throw NEXT_REDIRECT
  }
}

export async function signInWithGitHub(callbackUrl?: string) {
  await signIn("github", { redirectTo: callbackUrl ?? "/dashboard" });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

export async function signUpWithCredentials(
  name: string,
  email: string,
  password: string
): Promise<{ error?: string; success?: boolean }> {
  if (!name?.trim() || !email?.trim() || !password) {
    return { error: "All fields are required" };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Invalid email address" };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "An account with this email already exists" };

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: { name: name.trim(), email: email.trim(), passwordHash },
  });

  return { success: true };
}
