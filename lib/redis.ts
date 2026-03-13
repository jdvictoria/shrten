import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const LINK_TTL = 60 * 60 * 24 * 30; // 30 days in seconds

/**
 * Shape stored in Redis for each slug.
 * Includes all data needed to serve a redirect without hitting the DB.
 */
export type CachedLink = {
  id: string;
  url: string;
  expiresAt: string | null; // ISO string
  hasPassword: boolean;
  isActive: boolean;
  geoRules: Array<{ country: string; url: string }>;
};
