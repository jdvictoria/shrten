import type { Metadata } from "next";
import { ShortenForm } from "@/components/shorten-form";
import { Badge } from "@/components/ui/badge";
import { Link2, Zap, BarChart3 } from "lucide-react";

export const metadata: Metadata = {
  title: "shrten — Free URL Shortener",
  description:
    "Shorten any URL in seconds for free. No account required. Track clicks and manage links with shrten.",
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <div className="flex flex-col items-center w-full px-4 py-12 relative">
      {/* Decorative orbs */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/4 w-[600px] h-[300px] rounded-full opacity-30 blur-3xl"
        style={{
          background:
            "radial-gradient(ellipse, hsl(258 82% 58% / 0.4) 0%, hsl(231 90% 62% / 0.2) 60%, transparent 100%)",
        }}
      />
      <div
        aria-hidden
        className="dark:block hidden pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/4 w-[600px] h-[300px] rounded-full opacity-40 blur-3xl"
        style={{
          background:
            "radial-gradient(ellipse, hsl(258 82% 66% / 0.35) 0%, hsl(231 90% 68% / 0.15) 60%, transparent 100%)",
        }}
      />

      {/* Hero text */}
      <div className="relative text-center mb-10 space-y-5">
        <Badge
          variant="secondary"
          className="text-xs px-3 py-1 rounded-full border border-primary/20 bg-primary/8 text-primary font-medium"
        >
          <Zap className="h-3 w-3 mr-1" />
          Fast &amp; Serverless
        </Badge>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
          Shorten any URL
          <br />
          <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            in seconds
          </span>
        </h1>

        <p className="text-base text-muted-foreground max-w-sm mx-auto leading-relaxed">
          Create short, memorable links instantly. Track clicks and manage your
          links from one dashboard.
        </p>

        {/* Stat pills */}
        <div className="flex items-center justify-center gap-3 pt-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link2 className="h-3.5 w-3.5 text-primary/70" />
            <span>Free forever</span>
          </div>
          <div className="w-px h-3 bg-border" />
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <BarChart3 className="h-3.5 w-3.5 text-primary/70" />
            <span>Click analytics</span>
          </div>
          <div className="w-px h-3 bg-border" />
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Zap className="h-3.5 w-3.5 text-primary/70" />
            <span>No sign-up needed</span>
          </div>
        </div>
      </div>

      <ShortenForm />
    </div>
  );
}
