"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  Scissors,
  X,
} from "lucide-react";
import { GeoRulesInput } from "@/components/geo-rules-input";
import { useShortenForm, type SlugStatus } from "@/hooks/use-shorten-form";

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

export function ShortenForm() {
  const { state, dispatch, isPending, urlInputRef, appDomain, shortUrl, handleSubmit, handleCopy } =
    useShortenForm();

  const { url, customSlug, expiresAt, password, showPassword, geoRules, slugStatus, result, copied, showAdvanced } =
    state;

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Scissors className="h-5 w-5" />
          Shorten a URL
        </CardTitle>
        <CardDescription>Paste your long URL to get a short, shareable link</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* URL input */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Label htmlFor="url" className="sr-only">URL</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://example.com/very/long/url..."
                ref={urlInputRef}
                value={url}
                onChange={(e) => dispatch({ type: "PATCH", payload: { url: e.target.value } })}
                required
                disabled={isPending}
                className="pr-16"
              />
              <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:inline-flex items-center gap-0.5 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                ⌘K
              </kbd>
            </div>
            <Button
              type="submit"
              disabled={isPending || slugStatus === "taken" || slugStatus === "invalid"}
              className="shrink-0"
            >
              {isPending ? <Loader2 className="animate-spin" /> : "Shorten"}
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
                <Label htmlFor="slug">Custom alias</Label>
                <div className="flex items-center rounded-md border border-input focus-within:ring-1 focus-within:ring-ring overflow-hidden bg-background">
                  <span className="px-3 h-9 flex items-center text-sm text-muted-foreground bg-muted border-r whitespace-nowrap shrink-0">
                    {appDomain}/
                  </span>
                  <input
                    id="slug"
                    className="flex-1 px-3 h-9 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
                    placeholder="my-link"
                    value={customSlug}
                    onChange={(e) => dispatch({ type: "PATCH", payload: { customSlug: e.target.value } })}
                    disabled={isPending}
                    readOnly
                    onFocus={(e) => e.target.removeAttribute("readonly")}
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

              {/* Password protection */}
              <div className="space-y-1.5">
                <Label htmlFor="password">
                  Password protection{" "}
                  <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Leave blank for public access"
                    value={password}
                    onChange={(e) => dispatch({ type: "PATCH", payload: { password: e.target.value } })}
                    disabled={isPending}
                    className="pr-10"
                    readOnly
                    onFocus={(e) => e.target.removeAttribute("readonly")}
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
                <Label htmlFor="expires">
                  Expiration date{" "}
                  <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Input
                  id="expires"
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => dispatch({ type: "PATCH", payload: { expiresAt: e.target.value } })}
                  min={new Date(Date.now() + 60_000).toISOString().slice(0, 16)}
                  disabled={isPending}
                />
              </div>

              {/* Geo rules */}
              <GeoRulesInput
                rules={geoRules}
                onChange={(rules) => dispatch({ type: "PATCH", payload: { geoRules: rules } })}
              />
            </div>
          )}
        </form>

        {/* Result */}
        {result && (
          <div data-testid="shorten-result" className="flex items-center gap-2 p-3 bg-muted rounded-lg border">
            <span className="flex-1 text-sm font-medium truncate">{shortUrl}</span>
            <Button size="icon" variant="ghost" onClick={handleCopy} className="shrink-0 h-8 w-8">
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
