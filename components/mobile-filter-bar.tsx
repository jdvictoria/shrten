"use client";

import Link from "next/link";
import { Archive, FolderOpen, Link2, Tag } from "lucide-react";

type FolderItem = { id: string; name: string; color: string };
type TagItem = { id: string; name: string; color: string };

interface MobileFilterBarProps {
  folders: FolderItem[];
  tags: TagItem[];
  activeFolderId?: string;
  activeTagId?: string;
  showArchived?: boolean;
}

function pill(active: boolean) {
  return `inline-flex items-center gap-1.5 shrink-0 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
    active
      ? "bg-primary text-primary-foreground border-primary"
      : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
  }`;
}

export function MobileFilterBar({
  folders,
  tags,
  activeFolderId,
  activeTagId,
  showArchived,
}: MobileFilterBarProps) {
  const isAll = !activeFolderId && !activeTagId && !showArchived;

  return (
    <div className="lg:hidden -mx-4 px-4 overflow-x-auto pb-1">
      <div className="flex items-center gap-2 w-max">
        {/* All */}
        <Link href="/dashboard" className={pill(isAll)}>
          <Link2 className="h-3 w-3" />
          All
        </Link>

        {/* Folders */}
        {folders.map((f) => (
          <Link
            key={f.id}
            href={`/dashboard?folderId=${f.id}`}
            className={pill(activeFolderId === f.id)}
          >
            <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: f.color }} />
            {f.name}
          </Link>
        ))}

        {/* Tags */}
        {tags.map((t) => (
          <Link
            key={t.id}
            href={`/dashboard?tagId=${t.id}`}
            className={pill(activeTagId === t.id)}
          >
            <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
            {t.name}
          </Link>
        ))}

        {/* Archived */}
        <Link href="/dashboard?archived=1" className={pill(!!showArchived)}>
          <Archive className="h-3 w-3" />
          Archived
        </Link>
      </div>
    </div>
  );
}
