"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import {
  Archive,
  FolderOpen,
  Link2,
  Loader2,
  LogOut,
  Moon,
  Plus,
  Sun,
  Tag,
  Trash2,
  Users,
} from "lucide-react";
import { createFolder, deleteFolder } from "@/lib/folder-actions";
import { createTag, deleteTag } from "@/lib/tag-actions";
import { signOutAction } from "@/lib/auth-actions";
import { toast } from "sonner";

type FolderItem = { id: string; name: string; color: string; _count: { links: number } };
type TagItem = { id: string; name: string; color: string; _count: { links: number } };
type User = { name?: string | null; email?: string | null; image?: string | null };

interface DashboardSidebarProps {
  folders: FolderItem[];
  tags: TagItem[];
  activeFolderId?: string;
  activeTagId?: string;
  showArchived?: boolean;
  user?: User;
}

export function DashboardSidebar({
  folders: initialFolders,
  tags: initialTags,
  activeFolderId,
  activeTagId,
  showArchived,
  user,
}: DashboardSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, setTheme } = useTheme();
  const [isPending, startTransition] = useTransition();

  const [folders, setFolders] = useState(initialFolders);
  const [tags, setTags] = useState(initialTags);
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [showNewTag, setShowNewTag] = useState(false);
  const [deletingFolderId, setDeletingFolderId] = useState<string | null>(null);
  const [deletingTagId, setDeletingTagId] = useState<string | null>(null);

  function buildUrl(params: Record<string, string | undefined>) {
    const current = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === "") current.delete(k);
      else current.set(k, v);
    }
    const qs = current.toString();
    return `/dashboard${qs ? `?${qs}` : ""}`;
  }

  function handleCreateFolder() {
    if (!newFolderName.trim()) return;
    startTransition(async () => {
      const res = await createFolder(newFolderName.trim());
      if (!res.success) { toast.error(res.error); return; }
      setFolders((prev) => [...prev, { id: res.data.id, name: res.data.name, color: "#06b6d4", _count: { links: 0 } }]);
      setNewFolderName("");
      setShowNewFolder(false);
      toast.success("Folder created");
    });
  }

  function handleDeleteFolder(id: string) {
    setDeletingFolderId(id);
    startTransition(async () => {
      const res = await deleteFolder(id);
      if (!res.success) { toast.error(res.error); }
      else {
        setFolders((prev) => prev.filter((f) => f.id !== id));
        if (activeFolderId === id) router.push("/dashboard");
        toast.success("Folder deleted");
      }
      setDeletingFolderId(null);
    });
  }

  function handleCreateTag() {
    if (!newTagName.trim()) return;
    startTransition(async () => {
      const res = await createTag(newTagName.trim());
      if (!res.success) { toast.error(res.error); return; }
      setTags((prev) => [...prev, { id: res.data.id, name: res.data.name, color: res.data.color, _count: { links: 0 } }]);
      setNewTagName("");
      setShowNewTag(false);
      toast.success("Tag created");
    });
  }

  function handleDeleteTag(id: string) {
    setDeletingTagId(id);
    startTransition(async () => {
      const res = await deleteTag(id);
      if (!res.success) { toast.error(res.error); }
      else {
        setTags((prev) => prev.filter((t) => t.id !== id));
        if (activeTagId === id) router.push("/dashboard");
        toast.success("Tag deleted");
      }
      setDeletingTagId(null);
    });
  }

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isAll = !activeFolderId && !activeTagId && !showArchived;

  return (
    <Sidebar collapsible="icon">
      {/* ── Header: brand ── */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg">
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold shrink-0">
                  S
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="font-semibold text-sm">shrtnr</span>
                  <span className="text-xs text-sidebar-foreground/50">URL Shortener</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator />

      {/* ── Nav ── */}
      <SidebarContent>

        {/* Links nav */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isAll} tooltip="All Links">
                  <Link href="/dashboard">
                    <Link2 className="h-4 w-4" />
                    <span>All Links</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={!!showArchived} tooltip="Archived">
                  <Link href={buildUrl({ archived: showArchived ? undefined : "1", folderId: undefined, tagId: undefined })}>
                    <Archive className="h-4 w-4" />
                    <span>Archived</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Teams */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-1.5">
            <Users className="h-3 w-3" />
            Organization
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Teams">
                  <Link href="/dashboard/teams">
                    <Users className="h-4 w-4" />
                    <span>Teams</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Folders */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between pr-0">
            <span className="flex items-center gap-1.5">
              <FolderOpen className="h-3 w-3" />
              Folders
            </span>
            <button
              onClick={() => setShowNewFolder((v) => !v)}
              className="ml-auto text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors p-0.5 rounded"
              title="New folder"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {folders.map((folder) => (
                <SidebarMenuItem key={folder.id}>
                  <SidebarMenuButton asChild isActive={activeFolderId === folder.id} tooltip={folder.name}>
                    <Link href={buildUrl({ folderId: folder.id, tagId: undefined, archived: undefined })}>
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: folder.color }} />
                      <span>{folder.name}</span>
                      <span className="ml-auto text-xs text-sidebar-foreground/40 tabular-nums">{folder._count.links}</span>
                    </Link>
                  </SidebarMenuButton>
                  <SidebarMenuAction showOnHover onClick={() => handleDeleteFolder(folder.id)} disabled={deletingFolderId === folder.id || isPending} title="Delete folder">
                    {deletingFolderId === folder.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                  </SidebarMenuAction>
                </SidebarMenuItem>
              ))}
              {showNewFolder && (
                <SidebarMenuItem>
                  <div className="px-1 py-1 space-y-1">
                    <Input autoFocus placeholder="Folder name…" value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleCreateFolder();
                        if (e.key === "Escape") { setShowNewFolder(false); setNewFolderName(""); }
                      }}
                      className="h-7 text-xs" />
                    <div className="flex gap-1">
                      <button onClick={handleCreateFolder} disabled={!newFolderName.trim() || isPending}
                        className="flex-1 rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground disabled:opacity-50">
                        {isPending ? <Loader2 className="h-3 w-3 animate-spin mx-auto" /> : "Create"}
                      </button>
                      <button onClick={() => { setShowNewFolder(false); setNewFolderName(""); }}
                        className="rounded-md px-2 py-1 text-xs hover:bg-sidebar-accent">Cancel</button>
                    </div>
                  </div>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Tags */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between pr-0">
            <span className="flex items-center gap-1.5">
              <Tag className="h-3 w-3" />
              Tags
            </span>
            <button
              onClick={() => setShowNewTag((v) => !v)}
              className="ml-auto text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors p-0.5 rounded"
              title="New tag"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {tags.map((tag) => (
                <SidebarMenuItem key={tag.id}>
                  <SidebarMenuButton asChild isActive={activeTagId === tag.id} tooltip={tag.name}>
                    <Link href={buildUrl({ tagId: tag.id, folderId: undefined, archived: undefined })}>
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />
                      <span>{tag.name}</span>
                      <span className="ml-auto text-xs text-sidebar-foreground/40 tabular-nums">{tag._count.links}</span>
                    </Link>
                  </SidebarMenuButton>
                  <SidebarMenuAction showOnHover onClick={() => handleDeleteTag(tag.id)} disabled={deletingTagId === tag.id || isPending} title="Delete tag">
                    {deletingTagId === tag.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                  </SidebarMenuAction>
                </SidebarMenuItem>
              ))}
              {showNewTag && (
                <SidebarMenuItem>
                  <div className="px-1 py-1 space-y-1">
                    <Input autoFocus placeholder="Tag name…" value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleCreateTag();
                        if (e.key === "Escape") { setShowNewTag(false); setNewTagName(""); }
                      }}
                      className="h-7 text-xs" />
                    <div className="flex gap-1">
                      <button onClick={handleCreateTag} disabled={!newTagName.trim() || isPending}
                        className="flex-1 rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground disabled:opacity-50">
                        {isPending ? <Loader2 className="h-3 w-3 animate-spin mx-auto" /> : "Create"}
                      </button>
                      <button onClick={() => { setShowNewTag(false); setNewTagName(""); }}
                        className="rounded-md px-2 py-1 text-xs hover:bg-sidebar-accent">Cancel</button>
                    </div>
                  </div>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>


      </SidebarContent>

      {/* ── Footer: theme + user + sign out ── */}
      <SidebarSeparator />
      <SidebarFooter>
        <SidebarMenu>
          {/* Dark mode toggle */}
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              tooltip={mounted ? (theme === "dark" ? "Light mode" : "Dark mode") : "Toggle theme"}
            >
              {mounted && theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              <span>{mounted ? (theme === "dark" ? "Light mode" : "Dark mode") : "Dark mode"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Sign out */}
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => { startTransition(async () => { await signOutAction(); }); }}
              tooltip="Sign out"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
