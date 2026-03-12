import { notFound } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";
import { ArrowLeft, Clock, ExternalLink, MousePointerClick } from "lucide-react";
import { getLinkAnalytics } from "@/lib/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnalyticsChart } from "@/components/analytics-chart";

// Converts ISO country code to flag emoji
function flag(code: string) {
  return code
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(c.charCodeAt(0) + 127397));
}

function BreakdownBar({
  items,
  label,
  total,
}: {
  items: { name: string; count: number }[];
  label: string;
  total: number;
}) {
  if (items.length === 0)
    return <p className="text-sm text-muted-foreground py-4 text-center">No data yet.</p>;

  return (
    <div className="space-y-2">
      {items.map(({ name, count }) => {
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div key={name}>
            <div className="flex items-center justify-between mb-1 text-sm">
              <span className="truncate">{name}</span>
              <span className="ml-3 shrink-0 font-medium">
                {count}{" "}
                <span className="text-muted-foreground font-normal">({pct}%)</span>
              </span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default async function LinkAnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ days?: string }>;
}) {
  const { id } = await params;
  const { days: daysParam } = await searchParams;
  const days = daysParam === "7" ? 7 : 30;

  const data = await getLinkAnalytics(id, days);
  if (!data) notFound();

  const { link, clicksByDay, topReferers, topCountries, deviceStats, browserStats, osStats, totalInPeriod } = data;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto")?.split(",")[0] ?? "http";
  const appUrl = `${proto}://${host}`;
  const shortUrl = `${appUrl}/${link.slug}`;
  const isExpired = link.expiresAt && link.expiresAt < new Date();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back */}
      <Button variant="ghost" size="sm" asChild className="-ml-2 mb-4">
        <Link href="/dashboard">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Link>
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h1 className="text-2xl font-bold">/{link.slug}</h1>
            {link.passwordHash && <Badge variant="outline">Password protected</Badge>}
            {isExpired && <Badge variant="destructive">Expired</Badge>}
          </div>
          <a href={link.url} target="_blank" rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:underline flex items-center gap-1 truncate max-w-lg">
            {link.url}
            <ExternalLink className="h-3 w-3 shrink-0" />
          </a>
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
            <span>Created {new Date(link.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
            {link.expiresAt && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {isExpired ? "Expired" : "Expires"}{" "}
                {new Date(link.expiresAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </span>
            )}
          </div>
        </div>
        <a href={shortUrl} target="_blank" rel="noopener noreferrer"
          className="text-sm text-primary hover:underline shrink-0">
          {shortUrl.replace(/^https?:\/\//, "")}
        </a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <MousePointerClick className="h-4 w-4" />All-time clicks
            </CardTitle>
          </CardHeader>
          <CardContent><div className="text-3xl font-bold">{link.clicks}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <MousePointerClick className="h-4 w-4" />Last {days} days
            </CardTitle>
          </CardHeader>
          <CardContent><div className="text-3xl font-bold">{totalInPeriod}</div></CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle>Clicks over time</CardTitle>
            <div className="flex gap-1">
              <Button variant={days === 7 ? "default" : "ghost"} size="sm" className="h-7 px-3 text-xs" asChild>
                <Link href={`/dashboard/${id}?days=7`}>7d</Link>
              </Button>
              <Button variant={days === 30 ? "default" : "ghost"} size="sm" className="h-7 px-3 text-xs" asChild>
                <Link href={`/dashboard/${id}?days=30`}>30d</Link>
              </Button>
            </div>
          </div>
          <CardDescription>
            {totalInPeriod} click{totalInPeriod !== 1 ? "s" : ""} in the last {days} days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AnalyticsChart data={clicksByDay} />
        </CardContent>
      </Card>

      {/* Breakdown tabs */}
      <Tabs defaultValue="country">
        <TabsList className="mb-4">
          <TabsTrigger value="country">Country</TabsTrigger>
          <TabsTrigger value="device">Device</TabsTrigger>
          <TabsTrigger value="browser">Browser</TabsTrigger>
          <TabsTrigger value="os">OS</TabsTrigger>
          <TabsTrigger value="referer">Referer</TabsTrigger>
        </TabsList>

        <Card>
          <CardContent className="pt-6">
            <TabsContent value="country">
              <BreakdownBar
                items={topCountries.map((c) => ({
                  name: `${flag(c.name)} ${c.name}`,
                  count: c.count,
                }))}
                total={totalInPeriod}
                label="country"
              />
            </TabsContent>
            <TabsContent value="device">
              <BreakdownBar items={deviceStats} total={totalInPeriod} label="device" />
            </TabsContent>
            <TabsContent value="browser">
              <BreakdownBar items={browserStats} total={totalInPeriod} label="browser" />
            </TabsContent>
            <TabsContent value="os">
              <BreakdownBar items={osStats} total={totalInPeriod} label="os" />
            </TabsContent>
            <TabsContent value="referer">
              <BreakdownBar items={topReferers} total={totalInPeriod} label="referer" />
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}
