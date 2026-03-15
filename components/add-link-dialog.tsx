"use client";

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
  Eye,
  EyeOff,
  Loader2,
  Plus,
  Scissors,
  X,
} from "lucide-react";
import { GeoRulesInput } from "@/components/geo-rules-input";
import { useAddLinkDialog, type SlugStatus } from "@/hooks/use-add-link-dialog";

type Folder = { id: string; name: string; color: string };

interface AddLinkDialogProps {
  folders: Folder[];
}

const SLUG_INDICATOR: Record<SlugStatus, React.ReactNode> = {
  checking: <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />,
  available: <Check className="h-4 w-4 text-green-500" />,
  taken:     <X className="h-4 w-4 text-destructive" />,
  invalid:   <AlertCircle className="h-4 w-4 text-destructive" />,
  idle:      null,
};

const SLUG_HINT: Record<SlugStatus, { text: string; cls: string } | null> = {
  available: { text: "Available!",                            cls: "text-green-600"   },
  taken:     { text: "Already taken",                         cls: "text-destructive" },
  invalid:   { text: "Letters, numbers, - or _ (2–50 chars)", cls: "text-destructive" },
  checking:  null,
  idle:      null,
};

export function AddLinkDialog({ folders }: AddLinkDialogProps) {
  const { state, dispatch, isPending, appDomain, handleSubmit } = useAddLinkDialog();

  const { open, url, customSlug, expiresAt, folderId, notes, password, showPassword, geoRules, slugStatus, showAdvanced } =
    state;

  return (
    <Dialog open={open} onOpenChange={(v) => dispatch({ type: v ? "OPEN" : "CLOSE" })}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          New Link
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg bg-card text-card-foreground shadow">
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
                onChange={(e) => dispatch({ type: "PATCH", payload: { url: e.target.value } })}
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
            onClick={() => dispatch({ type: "PATCH", payload: { showAdvanced: !showAdvanced } })}
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
                    onChange={(e) => dispatch({ type: "PATCH", payload: { customSlug: e.target.value } })}
                    disabled={isPending}
                    autoComplete="off"
                    spellCheck={false}
                  />
                  {SLUG_INDICATOR[slugStatus] && (
                    <span className="pr-3">{SLUG_INDICATOR[slugStatus]}</span>
                  )}
                </div>
                {SLUG_HINT[slugStatus] && (
                  <p className={`text-xs ${SLUG_HINT[slugStatus]!.cls}`}>{SLUG_HINT[slugStatus]!.text}</p>
                )}
              </div>

              {/* Folder */}
              {folders.length > 0 && (
                <div className="space-y-1.5">
                  <Label>Folder</Label>
                  <Select
                    value={folderId}
                    onValueChange={(v) => dispatch({ type: "PATCH", payload: { folderId: v } })}
                    disabled={isPending}
                  >
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

              {/* Password protection */}
              <div className="space-y-1.5">
                <Label htmlFor="al-password">
                  Password protection{" "}
                  <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <div className="relative">
                  <Input
                    id="al-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Leave blank for public access"
                    value={password}
                    onChange={(e) => dispatch({ type: "PATCH", payload: { password: e.target.value } })}
                    disabled={isPending}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => dispatch({ type: "PATCH", payload: { showPassword: !showPassword } })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

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
                  onChange={(e) => dispatch({ type: "PATCH", payload: { expiresAt: e.target.value } })}
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
                  onChange={(e) => dispatch({ type: "PATCH", payload: { notes: e.target.value } })}
                  disabled={isPending}
                />
              </div>

              {/* Geo redirects */}
              <GeoRulesInput
                rules={geoRules}
                onChange={(rules) => dispatch({ type: "PATCH", payload: { geoRules: rules } })}
              />
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
