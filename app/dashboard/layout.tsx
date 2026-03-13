import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getFolders } from "@/lib/folder-actions";
import { getTags } from "@/lib/tag-actions";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard-sidebar";

export default async function DashboardLayout({
  children,
  searchParams,
}: {
  children: React.ReactNode;
  searchParams?: Promise<{ folderId?: string; archived?: string; tagId?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const params = await searchParams;
  const folderId = params?.folderId;
  const tagId = params?.tagId;
  const showArchived = params?.archived === "1";

  const [folders, tags] = await Promise.all([getFolders(), getTags()]);

  return (
    <SidebarProvider className="h-svh">
      <DashboardSidebar
        folders={folders}
        tags={tags}
        activeFolderId={folderId}
        activeTagId={tagId}
        showArchived={showArchived}
        user={session.user}
      />
      <SidebarInset className="overflow-y-auto">
        {/* Mobile top bar */}
        <header className="flex h-12 items-center gap-2 border-b border-border px-4 md:hidden shrink-0">
          <SidebarTrigger />
          <span className="font-semibold text-sm">shrtnr</span>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
