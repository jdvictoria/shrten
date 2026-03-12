import Link from "next/link";
import { headers } from "next/headers";
import { ArrowRight } from "lucide-react";
import { ShortenForm } from "@/components/shorten-form";
import { Badge } from "@/components/ui/badge";
import { getLinks } from "@/lib/actions";

export default async function Home() {
  const links = await getLinks();
  const recentLinks = links.slice(0, 3);
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto")?.split(",")[0] ?? "http";
  const appUrl = `${proto}://${host}`;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center px-4 py-16">
      <div className="text-center mb-10 space-y-4">
        <Badge variant="secondary" className="text-xs">
          Fast &amp; Serverless
        </Badge>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          Shorten any URL
          <br />
          in seconds
        </h1>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          Create short, memorable links instantly. Track clicks and manage your
          links from one dashboard.
        </p>
      </div>

      <ShortenForm />

      {recentLinks.length > 0 && (
        <div className="mt-12 w-full max-w-2xl">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-muted-foreground">
              Recent links
            </p>
            <Link
              href="/dashboard"
              className="text-sm text-primary flex items-center gap-1 hover:underline"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {recentLinks.map((link) => (
              <div
                key={link.id}
                className="flex items-center justify-between p-3 border rounded-lg bg-card"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {appUrl}/{link.slug}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {link.url}
                  </p>
                </div>
                <Badge variant="outline" className="ml-3 shrink-0">
                  {link.clicks} click{link.clicks !== 1 ? "s" : ""}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
