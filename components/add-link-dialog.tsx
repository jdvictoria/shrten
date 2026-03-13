"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  Plus,
  Scissors,
  X,
} from "lucide-react";
import { createLink } from "@/lib/actions";
import { getAppUrl } from "@/lib/utils";
import { toast } from "sonner";

type Folder = { id: string; name: string; color: string };
type SlugStatus = "idle" | "checking" | "available" | "taken" | "invalid";

interface AddLinkDialogProps {
  folders: Folder[];
}

export function AddLinkDialog({ folders }: AddLinkDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [url, setUrl] = useState("");
  const [customSlug, setCustomSlug] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [folderId, setFolderId] = useState("");
  const [notes, setNotes] = useState("");
  const [slugStatus, setSlugStatus] = useState<SlugStatus>("idle");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const appUrl = getAppUrl();
  const appDomain = appUrl.replace(/^https?:\/\//, "");

  // Debounced slug check
  useEffect(() => {
    if (!customSlug.trim()) { setSlugStatus("idle"); return; }
    if (!/^[a-zA-Z0-9_-]+$/.test(customSlug) || customSlug.length < 2 || customSlug.length > 50) {
      setSlugStatus("invalid"); return;
    }
    setSlugStatus("checking");
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/check-slug?slug=${encodeURIComponent(customSlug)}`);
        const data: { available: boolean } = await res.json();
        setSlugStatus(data.available ? "available" : "taken");
      } catch { setSlugStatus("idle"); }
    }, 400);
    return () => clearTimeout(t);
  }, [customSlug]);

  function reset() {
    setUrl(""); setCustomSlug(""); setExpiresAt("");
    setFolderId(""); setNotes(""); setSlugStatus("idle");
    setShowAdvanced(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() || slugStatus === "taken" || slugStatus === "invalid") return;
    startTransition(async () => {
      const res = await createLink(
        url.trim(),
        customSlug.trim() || undefined,
        expiresAt || undefined,
        folderId || undefined,
        notes.trim() || undefined,
      );
      if (!res.success) { toast.error(res.error); return; }
      toast.success("Link created!");
      setOpen(false);
      reset();
      router.refresh();
    });
  }

  const slugIndicator: Record<SlugStatus, React.ReactNode> = {
    checking: <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />,
    available: <Check className="h-4 w-4 text-green-500" />,
    taken: <X className="h-4 w-4 text-destructive" />,
    invalid: <AlertCircle className="h-4 w-4 text-destructive" />,
    idle: null,
  };
  const slugHint: Record<SlugStatus, { text: string; cls: string } | null> = {
    available: { text: "Available!", cls: "text-green-600" },
    taken: { text: "Already taken", cls: "text-destructive" },
    invalid: { text: "Letters, numbers, - or _ (2–50 chars)", cls: "text-destructive" },
    checking: null, idle: null,
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          New Link
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scissors className="h-4 w-4" />
            Shorten a URL
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* URL + submit row */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="al-url" className="sr-only">URL</Label>
              <Input
                id="al-url"
                type="url"
                placeholder="https://example.com/very/long/url..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isPending}
                required
                autoFocus
              />
            </div>
            <Button
              type="submit"
              disabled={isPending || !url.trim() || slugStatus === "taken" || slugStatus === "invalid"}
              className="shrink-0"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Shorten"}
            </Button>
          </div>

          {/* Advanced toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {showAdvanced ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            Advanced options
          </button>

          {showAdvanced && (
            <div className="space-y-5 pt-2 border-t">
              {/* Custom alias */}
              <div className="space-y-1.5">
                <Label htmlFor="al-slug">Custom alias</Label>
                <div className="flex items-center rounded-md border border-input focus-within:ring-1 focus-within:ring-ring overflow-hidden bg-background">
                  <span className="px-3 h-9 flex items-center text-sm text-muted-foreground bg-muted border-r whitespace-nowrap shrink-0">
                    {appDomain}/
                  </span>
                  <input
                    id="al-slug"
                    className="flex-1 px-3 h-9 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
                    placeholder="my-link"
                    value={customSlug}
                    onChange={(e) => setCustomSlug(e.target.value)}
                    disabled={isPending}
                    autoComplete="off"
                    spellCheck={false}
                  />
                  {slugIndicator[slugStatus] && (
                    <span className="pr-3">{slugIndicator[slugStatus]}</span>
                  )}
                </div>
                {slugHint[slugStatus] && (
                  <p className={`text-xs ${slugHint[slugStatus]!.cls}`}>{slugHint[slugStatus]!.text}</p>
                )}
              </div>

              {/* Folder */}
              {folders.length > 0 && (
                <div className="space-y-1.5">
                  <Label>Folder</Label>
                  <Select value={folderId} onValueChange={setFolderId} disabled={isPending}>
                    <SelectTrigger>
                      <SelectValue placeholder="No folder" />
                    </SelectTrigger>
                    <SelectContent>
                      {folders.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          <span className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: f.color }} />
                            {f.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Expiration */}
              <div className="space-y-1.5">
                <Label htmlFor="al-expires">
                  Expiration date{" "}
                  <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Input
                  id="al-expires"
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  min={new Date(Date.now() + 60_000).toISOString().slice(0, 16)}
                  disabled={isPending}
                />
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <Label htmlFor="al-notes">
                  Notes{" "}
                  <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Input
                  id="al-notes"
                  placeholder="Internal notes…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={isPending}
                />
              </div>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
