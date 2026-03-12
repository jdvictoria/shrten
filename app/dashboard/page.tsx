import { redirect } from "next/navigation";
import { Link2, MousePointerClick, TrendingUp } from "lucide-react";
import { auth } from "@/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LinksTable } from "@/components/links-table";
import { BulkUpload } from "@/components/bulk-upload";
import { getLinks, getStats } from "@/lib/actions";

export default async function Dashboard() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const [links, stats] = await Promise.all([getLinks(), getStats()]);

  const avgClicks =
    stats.totalLinks > 0 ? (stats.totalClicks / stats.totalLinks).toFixed(1) : "0";

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back, {session.user.name ?? session.user.email}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Links</CardTitle>
            <Link2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLinks}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClicks}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Clicks / Link</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgClicks}</div>
          </CardContent>
        </Card>
      </div>

      {/* Links table + Bulk import */}
      <div className="space-y-6">
        <LinksTable links={links} />
        <BulkUpload />
      </div>
    </div>
  );
}
