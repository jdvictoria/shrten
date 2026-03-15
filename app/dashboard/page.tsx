import { Link2, MousePointerClick, TrendingUp } from "lucide-react";
import { auth } from "@/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LinksTable } from "@/components/links-table";
import { BulkUpload } from "@/components/bulk-upload";
import { AddLinkDialog } from "@/components/add-link-dialog";
import { getLinks, getStats } from "@/lib/actions";
import { LINKS_PAGE_SIZE } from "@/lib/utils";
import { getFolders } from "@/lib/folder-actions";
import { getTags } from "@/lib/tag-actions";

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ folderId?: string; archived?: string; tagId?: string; page?: string }>;
}) {
  const session = await auth();

  const { folderId, archived, tagId, page: pageParam } = await searchParams;
  const showArchived = archived === "1";
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const [{ links, total }, stats, folders, tags] = await Promise.all([
    getLinks({ archived: showArchived, folderId, tagId, page, pageSize: LINKS_PAGE_SIZE }),
    getStats(),
    getFolders(),
    getTags(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / LINKS_PAGE_SIZE));
  const avgClicks =
    stats.totalLinks > 0 ? (stats.totalClicks / stats.totalLinks).toFixed(1) : "0";

  const folderProps = folders.map(({ id, name, color }) => ({ id, name, color }));
  const tagProps = tags.map(({ id, name, color }) => ({ id, name, color }));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Welcome back, {session?.user?.name ?? session?.user?.email}
          </p>
        </div>
        <div className="flex items-center gap-2 [&>*]:flex-1 sm:[&>*]:flex-none">
          <BulkUpload />
          <AddLinkDialog folders={folderProps} />
        </div>
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
        key={`${showArchived ? "archived" : "active"}-${folderId ?? ""}-${tagId ?? ""}-${page}`}
        links={links}
        folders={folderProps}
        tags={tagProps}
        showArchived={showArchived}
        page={page}
        totalPages={totalPages}
        total={total}
      />

    </div>
  );
}
