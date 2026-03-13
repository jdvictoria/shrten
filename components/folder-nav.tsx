"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Archive, ChevronDown, ChevronRight, FolderOpen, Link2, Loader2, Plus, Tag, Trash2 } from "lucide-react";
import { createFolder, deleteFolder } from "@/lib/folder-actions";
import { createTag, deleteTag } from "@/lib/tag-actions";
import { toast } from "sonner";

type FolderItem = {
  id: string;
  name: string;
  color: string;
  _count: { links: number };
};

type TagItem = {
  id: string;
  name: string;
  color: string;
  _count: { links: number };
};

interface FolderNavProps {
  folders: FolderItem[];
  tags: TagItem[];
  activeFolderId?: string;
  activeTagId?: string;
  showArchived?: boolean;
}

export function FolderNav({
  folders: initialFolders,
  tags: initialTags,
  activeFolderId,
  activeTagId,
  showArchived,
}: FolderNavProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [folders, setFolders] = useState(initialFolders);
  const [tags, setTags] = useState(initialTags);

  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [showNewTag, setShowNewTag] = useState(false);

  const [deletingFolderId, setDeletingFolderId] = useState<string | null>(null);
  const [deletingTagId, setDeletingTagId] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  function buildUrl(params: Record<string, string | undefined>) {
    const current = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === "") {
        current.delete(k);
      } else {
        current.set(k, v);
      }
    }
    return `/dashboard?${current.toString()}`;
  }

  function handleCreateFolder() {
    if (!newFolderName.trim()) return;
    startTransition(async () => {
      const res = await createFolder(newFolderName.trim());
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      setFolders((prev) => [
        ...prev,
        {
          id: res.data.id,
          name: res.data.name,
          color: "#06b6d4",
          _count: { links: 0 },
        },
      ]);
      setNewFolderName("");
      setShowNewFolder(false);
      toast.success("Folder created");
    });
  }

  function handleDeleteFolder(id: string) {
    setDeletingFolderId(id);
    startTransition(async () => {
      const res = await deleteFolder(id);
      if (!res.success) {
        toast.error(res.error);
      } else {
        setFolders((prev) => prev.filter((f) => f.id !== id));
        // Navigate away if current folder was deleted
        if (activeFolderId === id) {
          router.push("/dashboard");
        }
        toast.success("Folder deleted");
      }
      setDeletingFolderId(null);
    });
  }

  function handleCreateTag() {
    if (!newTagName.trim()) return;
    startTransition(async () => {
      const res = await createTag(newTagName.trim());
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      setTags((prev) => [
        ...prev,
        {
          id: res.data.id,
          name: res.data.name,
          color: res.data.color,
          _count: { links: 0 },
        },
      ]);
      setNewTagName("");
      setShowNewTag(false);
      toast.success("Tag created");
    });
  }

  function handleDeleteTag(id: string) {
    setDeletingTagId(id);
    startTransition(async () => {
      const res = await deleteTag(id);
      if (!res.success) {
        toast.error(res.error);
      } else {
        setTags((prev) => prev.filter((t) => t.id !== id));
        if (activeTagId === id) {
          router.push("/dashboard");
        }
        toast.success("Tag deleted");
      }
      setDeletingTagId(null);
    });
  }

  return (
    <nav className="text-sm">
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen((v) => !v)}
        className="lg:hidden w-full flex items-center justify-between px-2 py-2 mb-2 rounded-md text-sm font-medium hover:bg-accent transition-colors"
      >
        <span className="flex items-center gap-2 text-muted-foreground">
          <FolderOpen className="h-3.5 w-3.5" />
          Browse
        </span>
        {mobileOpen ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>

      <div className={`space-y-6 ${mobileOpen ? "block" : "hidden lg:block"}`}>
      {/* All links */}
      <div className="space-y-1">
        <Link
          href="/dashboard"
          className={`flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors hover:bg-accent ${
            !activeFolderId && !activeTagId && !showArchived
              ? "bg-accent text-accent-foreground font-medium"
              : "text-muted-foreground"
          }`}
        >
          <Link2 className="h-3.5 w-3.5 shrink-0" />
          All Links
        </Link>
      </div>

      {/* Folders section */}
      <div>
        <div className="flex items-center justify-between mb-1.5 px-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <FolderOpen className="h-3 w-3" />
            Folders
          </div>
          <button
            onClick={() => setShowNewFolder((v) => !v)}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="New folder"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="space-y-0.5">
          {folders.map((folder) => (
            <div
              key={folder.id}
              className={`group flex items-center justify-between px-2 py-1.5 rounded-md transition-colors hover:bg-accent ${
                activeFolderId === folder.id
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground"
              }`}
            >
              <Link
                href={buildUrl({
                  folderId: folder.id,
                  tagId: undefined,
                  archived: undefined,
                })}
                className="flex items-center gap-2 flex-1 min-w-0"
              >
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: folder.color }}
                />
                <span className="truncate">{folder.name}</span>
                <span className="ml-auto text-xs text-muted-foreground/60 shrink-0">
                  {folder._count.links}
                </span>
              </Link>
              <button
                onClick={() => handleDeleteFolder(folder.id)}
                disabled={deletingFolderId === folder.id || isPending}
                className="opacity-0 group-hover:opacity-100 ml-1 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                title="Delete folder"
              >
                {deletingFolderId === folder.id ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Trash2 className="h-3 w-3" />
                )}
              </button>
            </div>
          ))}

          {showNewFolder && (
            <div className="px-2 pt-1 space-y-1">
              <Input
                autoFocus
                placeholder="Folder name..."
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateFolder();
                  if (e.key === "Escape") {
                    setShowNewFolder(false);
                    setNewFolderName("");
                  }
                }}
                className="h-7 text-xs"
              />
              <div className="flex gap-1">
                <Button
                  size="sm"
                  className="h-6 px-2 text-xs flex-1"
                  onClick={handleCreateFolder}
                  disabled={!newFolderName.trim() || isPending}
                >
                  {isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    "Create"
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-xs"
                  onClick={() => {
                    setShowNewFolder(false);
                    setNewFolderName("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tags section */}
      <div>
        <div className="flex items-center justify-between mb-1.5 px-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Tag className="h-3 w-3" />
            Tags
          </div>
          <button
            onClick={() => setShowNewTag((v) => !v)}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="New tag"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="space-y-0.5">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className={`group flex items-center justify-between px-2 py-1.5 rounded-md transition-colors hover:bg-accent ${
                activeTagId === tag.id
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground"
              }`}
            >
              <Link
                href={buildUrl({
                  tagId: tag.id,
                  folderId: undefined,
                  archived: undefined,
                })}
                className="flex items-center gap-2 flex-1 min-w-0"
              >
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: tag.color }}
                />
                <span className="truncate">{tag.name}</span>
                <span className="ml-auto text-xs text-muted-foreground/60 shrink-0">
                  {tag._count.links}
                </span>
              </Link>
              <button
                onClick={() => handleDeleteTag(tag.id)}
                disabled={deletingTagId === tag.id || isPending}
                className="opacity-0 group-hover:opacity-100 ml-1 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                title="Delete tag"
              >
                {deletingTagId === tag.id ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Trash2 className="h-3 w-3" />
                )}
              </button>
            </div>
          ))}

          {showNewTag && (
            <div className="px-2 pt-1 space-y-1">
              <Input
                autoFocus
                placeholder="Tag name..."
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateTag();
                  if (e.key === "Escape") {
                    setShowNewTag(false);
                    setNewTagName("");
                  }
                }}
                className="h-7 text-xs"
              />
              <div className="flex gap-1">
                <Button
                  size="sm"
                  className="h-6 px-2 text-xs flex-1"
                  onClick={handleCreateTag}
                  disabled={!newTagName.trim() || isPending}
                >
                  {isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    "Create"
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-xs"
                  onClick={() => {
                    setShowNewTag(false);
                    setNewTagName("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Archive */}
      <div>
        <Link
          href={buildUrl({
            archived: showArchived ? undefined : "1",
            folderId: undefined,
            tagId: undefined,
          })}
          className={`flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors hover:bg-accent ${
            showArchived
              ? "bg-accent text-accent-foreground font-medium"
              : "text-muted-foreground"
          }`}
        >
          <Archive className="h-3.5 w-3.5 shrink-0" />
          Archived
        </Link>
      </div>

      </div>{/* end collapsible */}
    </nav>
  );
}
