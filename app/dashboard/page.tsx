import { Link2, MousePointerClick, TrendingUp } from "lucide-react";
import { auth } from "@/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LinksTable } from "@/components/links-table";
import { BulkUpload } from "@/components/bulk-upload";
import { AddLinkDialog } from "@/components/add-link-dialog";
import { getLinks, getStats } from "@/lib/actions";
import { getFolders } from "@/lib/folder-actions";
import { getTags } from "@/lib/tag-actions";

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ folderId?: string; archived?: string; tagId?: string }>;
}) {
  const session = await auth();

  const { folderId, archived, tagId } = await searchParams;
  const showArchived = archived === "1";

  const [links, stats, folders, tags] = await Promise.all([
    getLinks({ archived: showArchived, folderId }),
    getStats(),
    getFolders(),
    getTags(),
  ]);

  const filteredLinks = tagId
    ? links.filter((l) => l.tags.some((t) => t.tag.id === tagId))
    : links;

  const avgClicks =
    stats.totalLinks > 0 ? (stats.totalClicks / stats.totalLinks).toFixed(1) : "0";

  const folderProps = folders.map(({ id, name, color }) => ({ id, name, color }));
  const tagProps = tags.map(({ id, name, color }) => ({ id, name, color }));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Welcome back, {session?.user?.name ?? session?.user?.email}
          </p>
        </div>
        <AddLinkDialog folders={folderProps} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

      {/* Links table */}
      <LinksTable
        key={`${showArchived ? "archived" : "active"}-${folderId ?? ""}-${tagId ?? ""}`}
        links={filteredLinks}
        folders={folderProps}
        tags={tagProps}
        showArchived={showArchived}
      />

      <BulkUpload />
    </div>
  );
}
