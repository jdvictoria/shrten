import type { NextAuthConfig } from "next-auth";

/**
 * Edge-compatible auth config — no Node.js-only imports (no bcrypt, no Prisma).
 * Used by middleware.ts which runs in the Edge Runtime.
 * Full auth config (with adapter + providers) lives in auth.ts.
 */
export const authConfig = {
  pages: { signIn: "/sign-in" },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      return session;
    },
  },
} satisfies NextAuthConfig;
