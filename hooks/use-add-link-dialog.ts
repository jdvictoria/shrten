"use client";

import { useReducer, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createLink } from "@/lib/actions";
import { getAppUrl } from "@/lib/utils";
import { toast } from "sonner";
import type { GeoRule } from "@/components/geo-rules-input";

export type SlugStatus = "idle" | "checking" | "available" | "taken" | "invalid";

type State = {
  open: boolean;
  url: string;
  customSlug: string;
  expiresAt: string;
  folderId: string;
  notes: string;
  password: string;
  showPassword: boolean;
  geoRules: GeoRule[];
  slugStatus: SlugStatus;
  showAdvanced: boolean;
};

type Action =
  | { type: "PATCH"; payload: Partial<State> }
  | { type: "OPEN" }
  | { type: "CLOSE" };

const initial: State = {
  open: false,
  url: "",
  customSlug: "",
  expiresAt: "",
  folderId: "",
  notes: "",
  password: "",
  showPassword: false,
  geoRules: [],
  slugStatus: "idle",
  showAdvanced: false,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "PATCH":  return { ...state, ...action.payload };
    case "OPEN":   return { ...initial, open: true };
    case "CLOSE":  return { ...initial, open: false };
  }
}

export function useAddLinkDialog() {
  const router = useRouter();
  const [state, dispatch] = useReducer(reducer, initial);
  const [isPending, startTransition] = useTransition();

  const appDomain = getAppUrl().replace(/^https?:\/\//, "");

  // Debounced slug availability check
  useEffect(() => {
    const slug = state.customSlug;
    if (!slug.trim()) {
      dispatch({ type: "PATCH", payload: { slugStatus: "idle" } });
      return;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(slug) || slug.length < 2 || slug.length > 50) {
      dispatch({ type: "PATCH", payload: { slugStatus: "invalid" } });
      return;
    }
    dispatch({ type: "PATCH", payload: { slugStatus: "checking" } });
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/check-slug?slug=${encodeURIComponent(slug)}`);
        const { available } = (await res.json()) as { available: boolean };
        dispatch({ type: "PATCH", payload: { slugStatus: available ? "available" : "taken" } });
      } catch {
        dispatch({ type: "PATCH", payload: { slugStatus: "idle" } });
      }
    }, 400);
    return () => clearTimeout(t);
  }, [state.customSlug]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!state.url.trim() || state.slugStatus === "taken" || state.slugStatus === "invalid") return;
    startTransition(async () => {
      const res = await createLink(
        state.url.trim(),
        state.customSlug.trim() || undefined,
        state.expiresAt || undefined,
        state.folderId || undefined,
        state.notes.trim() || undefined,
        state.password.trim() || undefined,
        state.geoRules.filter((r) => r.country && r.url),
      );
      if (!res.success) { toast.error(res.error); return; }
      toast.success("Link created!");
      dispatch({ type: "CLOSE" });
      router.refresh();
    });
  }

  return { state, dispatch, isPending, appDomain, handleSubmit };
}
