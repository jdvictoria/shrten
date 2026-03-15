"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Archive,
  ArchiveRestore,
  CalendarIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  LineChart,
  Loader2,
  MoreHorizontal,
  Pencil,
  Pin,
  PinOff,
  Power,
  PowerOff,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { type DateRange } from "react-day-picker";
import { QRDialog } from "@/components/qr-dialog";
import { EditLinkDialog } from "@/components/edit-link-dialog";
import { deleteLink, togglePin, toggleActive, toggleArchive } from "@/lib/actions";
import { getAppUrl } from "@/lib/utils";
import { toast } from "sonner";

type TagData = { id: string; name: string; color: string };
type FolderData = { id: string; name: string; color: string };

type LinkRow = {
  id: string;
  slug: string;
  url: string;
  clicks: number;
  isPinned: boolean;
  isActive: boolean;
  isArchived: boolean;
  notes: string | null;
  expiresAt: Date | null;
  createdAt: Date;
  folder: FolderData | null;
  tags: { tag: TagData }[];
};

type SortKey = "createdAt" | "clicks" | "slug";
type SortDir = "asc" | "desc";

interface LinksTableProps {
  links: LinkRow[];
  folders: FolderData[];
  tags: TagData[];
  showArchived?: boolean;
  page: number;
  totalPages: number;
  total: number;
}

function ExpiryText({ expiresAt }: { expiresAt: Date | null }) {
  if (!expiresAt) return <span className="text-muted-foreground/40 text-sm">—</span>;
  const expired = expiresAt < new Date();
  return (
    <span className={`text-sm ${expired ? "text-destructive" : "text-muted-foreground"}`}>
      {new Date(expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
    </span>
  );
}

export function LinksTable({
  links: initialLinks,
  folders,
  tags,
  showArchived = false,
  page,
  totalPages,
  total,
}: LinksTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pinningId, setPinningId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [editingLink, setEditingLink] = useState<LinkRow | null>(null);
  const [isPending, startTransition] = useTransition();
  const [links, setLinks] = useState(initialLinks);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const appUrl = getAppUrl();

  function cycleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else { setSortKey(key); setSortDir("desc"); }
  }

  const filtered = useMemo(() => {
    let rows = [...links];
    rows.sort((a, b) => Number(b.isPinned) - Number(a.isPinned));

    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (l) =>
          l.slug.toLowerCase().includes(q) ||
          l.url.toLowerCase().includes(q) ||
          (l.notes ?? "").toLowerCase().includes(q)
      );
    }
    if (dateRange?.from) {
      rows = rows.filter((l) => new Date(l.createdAt) >= dateRange.from!);
    }
    if (dateRange?.to) {
      const to = new Date(dateRange.to);
      to.setHours(23, 59, 59, 999);
      rows = rows.filter((l) => new Date(l.createdAt) <= to);
    }

    const pinned = rows.filter((l) => l.isPinned);
    const unpinned = rows.filter((l) => !l.isPinned);

    function cmp(a: LinkRow, b: LinkRow) {
      if (sortKey === "clicks") return sortDir === "desc" ? b.clicks - a.clicks : a.clicks - b.clicks;
      if (sortKey === "slug") return sortDir === "desc" ? b.slug.localeCompare(a.slug) : a.slug.localeCompare(b.slug);
      const da = new Date(a.createdAt).getTime();
      const db = new Date(b.createdAt).getTime();
      return sortDir === "desc" ? db - da : da - db;
    }
    return [...pinned.sort(cmp), ...unpinned.sort(cmp)];
  }, [links, search, sortKey, sortDir, dateRange]);

  async function handleCopy(link: LinkRow) {
    await navigator.clipboard.writeText(`${appUrl}/${link.slug}`);
    setCopiedId(link.id);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  }

  function handleDelete(id: string) {
    setDeletingId(id);
    startTransition(async () => {
      const res = await deleteLink(id);
      if (!res.success) toast.error(res.error);
      else { setLinks((prev) => prev.filter((l) => l.id !== id)); toast.success("Link deleted"); }
      setDeletingId(null);
    });
  }

  function handlePin(id: string) {
    setPinningId(id);
    startTransition(async () => {
      const res = await togglePin(id);
      if (!res.success) toast.error(res.error);
      else {
        setLinks((prev) => prev.map((l) => l.id === id ? { ...l, isPinned: res.data.isPinned } : l));
        toast.success(res.data.isPinned ? "Link pinned" : "Link unpinned");
      }
      setPinningId(null);
    });
  }

  function handleToggleActive(id: string) {
    setTogglingId(id);
    startTransition(async () => {
      const res = await toggleActive(id);
      if (!res.success) toast.error(res.error);
      else {
        setLinks((prev) => prev.map((l) => l.id === id ? { ...l, isActive: res.data.isActive } : l));
        toast.success(res.data.isActive ? "Link activated" : "Link deactivated");
      }
      setTogglingId(null);
    });
  }

  function handleToggleArchive(id: string) {
    setArchivingId(id);
    startTransition(async () => {
      const res = await toggleArchive(id);
      if (!res.success) toast.error(res.error);
      else { setLinks((prev) => prev.filter((l) => l.id !== id)); toast.success(res.data.isArchived ? "Link archived" : "Link restored"); }
      setArchivingId(null);
    });
  }

  function handleSaved(id: string, updated: { url: string; notes: string | null; folderId: string | null; tagIds: string[] }) {
    setLinks((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        const newTags = tags.filter((t) => updated.tagIds.includes(t.id)).map((t) => ({ tag: t }));
        const newFolder = folders.find((f) => f.id === updated.folderId) ?? null;
        return { ...l, url: updated.url, notes: updated.notes, folderId: updated.folderId, folder: newFolder, tags: newTags };
      })
    );
  }

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`${pathname}?${params.toString()}`);
  }

  const SortBtn = ({ col, label }: { col: SortKey; label: string }) => (
    <button onClick={() => cycleSort(col)} className="flex items-center gap-0.5 hover:text-foreground transition-colors">
      {label}
      <span className="text-muted-foreground/50 text-[10px] ml-0.5">
        {sortKey === col ? (sortDir === "desc" ? "↓" : "↑") : "↕"}
      </span>
    </button>
  );

  /** Dropdown menu with Edit / Deactivate / Archive / Delete */
  function ActionsMenu({ link }: { link: LinkRow }) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" className="h-8 w-8">
            {deletingId === link.id || archivingId === link.id || togglingId === link.id
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <MoreHorizontal className="h-4 w-4" />
            }
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onSelect={() => setEditingLink(link)}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => handleToggleActive(link.id)} disabled={togglingId === link.id}>
            {link.isActive
              ? <><PowerOff className="h-4 w-4 mr-2" />Deactivate</>
              : <><Power className="h-4 w-4 mr-2" />Activate</>
            }
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => handleToggleArchive(link.id)} disabled={archivingId === link.id}>
            {link.isArchived
              ? <><ArchiveRestore className="h-4 w-4 mr-2" />Restore</>
              : <><Archive className="h-4 w-4 mr-2" />Archive</>
            }
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => handleDelete(link.id)}
            disabled={deletingId === link.id}
            className="text-destructive focus:text-destructive"
            data-testid={`delete-${link.id}`}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  const hasFilters = search || dateRange?.from;

  return (
    <>
      {/* Controlled edit dialog — rendered outside the table to avoid nesting issues */}
      {editingLink && (
        <EditLinkDialog
          link={editingLink}
          folders={folders}
          tags={tags}
          open={true}
          onOpenChange={(v) => { if (!v) setEditingLink(null); }}
          onSaved={(updated) => { handleSaved(editingLink.id, updated); setEditingLink(null); }}
        />
      )}

      <Card>
        <CardHeader>
          <div>
            <CardTitle>{showArchived ? "Archived Links" : "Your Links"}</CardTitle>
            <CardDescription>
              {total} link{total !== 1 ? "s" : ""} · page {page} of {totalPages}
            </CardDescription>
          </div>

          {/* Search + date filters */}
          <div className="flex flex-col gap-2 mt-2">
            {/* Row 1: search + calendar icon (always) */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search by slug, URL or notes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-8 text-sm"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={dateRange?.from ? "secondary" : "outline"}
                    size="sm"
                    className="h-8 w-8 p-0 shrink-0 sm:w-auto sm:gap-1.5 sm:px-2.5 sm:text-xs"
                  >
                    <CalendarIcon className="h-3.5 w-3.5 shrink-0" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <span className="hidden sm:inline">
                          {format(dateRange.from, "MMM d")} – {format(dateRange.to, "MMM d")}
                        </span>
                      ) : (
                        <span className="hidden sm:inline">From {format(dateRange.from, "MMM d")}</span>
                      )
                    ) : (
                      <span className="hidden sm:inline">Date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={1}
                    disabled={(date) => date > new Date()}
                  />
                </PopoverContent>
              </Popover>
              {hasFilters && (
                <Button variant="ghost" size="sm" className="hidden sm:inline-flex h-8 px-2 text-xs shrink-0" onClick={() => { setSearch(""); setDateRange(undefined); }}>
                  Clear
                </Button>
              )}
            </div>

            {/* Row 2 (mobile only): active date range + clear, full width */}
            {dateRange?.from && (
              <div className="flex items-center gap-2 sm:hidden">
                <div className="flex-1 h-8 flex items-center rounded-md border border-input bg-secondary px-2.5 text-xs text-secondary-foreground gap-1.5">
                  <CalendarIcon className="h-3.5 w-3.5 shrink-0" />
                  {dateRange.to
                    ? `${format(dateRange.from, "MMM d")} – ${format(dateRange.to, "MMM d")}`
                    : `From ${format(dateRange.from, "MMM d")}`}
                </div>
                <Button variant="ghost" size="sm" className="h-8 px-2 text-xs shrink-0" onClick={() => { setSearch(""); setDateRange(undefined); }}>
                  Clear
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {links.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {showArchived ? "No archived links." : "No links yet. Create your first short URL!"}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No links match your filters.</div>
          ) : (
            <TooltipProvider>
              {/* ── Desktop table ── */}
              <div className="hidden sm:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-6" />
                      <TableHead><SortBtn col="slug" label="Short URL" /></TableHead>
                      <TableHead>Original URL</TableHead>
                      <TableHead className="text-center w-20"><SortBtn col="clicks" label="Clicks" /></TableHead>
                      <TableHead className="w-32">Expires At</TableHead>
                      <TableHead className="w-32"><SortBtn col="createdAt" label="Created At" /></TableHead>
                      <TableHead className="text-right w-32">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((link) => {
                      const shortUrl = `${appUrl}/${link.slug}`;
                      return (
                        <TableRow key={link.id} data-testid="link-row" className={link.isPinned ? "bg-primary/5" : undefined}>
                          <TableCell className="pr-0">
                            {link.isPinned && <Pin className="h-3 w-3 text-primary rotate-45" />}
                          </TableCell>

                          <TableCell className="font-medium">
                            <a href={shortUrl} target="_blank" rel="noopener noreferrer"
                              className="text-primary hover:underline flex items-center gap-1 w-fit">
                              /{link.slug}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                            {link.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {link.tags.map(({ tag }) => (
                                  <span key={tag.id}
                                    className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium text-white"
                                    style={{ backgroundColor: tag.color }}>
                                    {tag.name}
                                  </span>
                                ))}
                              </div>
                            )}
                            {link.folder && (
                              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 mt-0.5">
                                <span className="h-1.5 w-1.5 rounded-full inline-block" style={{ backgroundColor: link.folder.color }} />
                                {link.folder.name}
                              </span>
                            )}
                          </TableCell>

                          <TableCell className="max-w-xs">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="block truncate text-muted-foreground text-sm cursor-default">{link.url}</span>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-sm break-all">{link.url}</TooltipContent>
                            </Tooltip>
                            {link.notes && (
                              <span className="block truncate text-xs text-muted-foreground/60 mt-0.5 italic">{link.notes}</span>
                            )}
                          </TableCell>

                          <TableCell className="text-center">
                            <Badge variant="secondary">{link.clicks}</Badge>
                          </TableCell>

                          <TableCell>
                            <div className="flex flex-col gap-1">
                              {!link.isActive && <Badge variant="destructive" className="text-xs w-fit">Inactive</Badge>}
                              <ExpiryText expiresAt={link.expiresAt} />
                            </div>
                          </TableCell>

                          <TableCell className="text-muted-foreground text-sm">
                            {new Date(link.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </TableCell>

                          <TableCell className="text-right">
                            <div className="flex justify-end items-center gap-1">
                              {/* Pin */}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handlePin(link.id)} disabled={pinningId === link.id || isPending}>
                                    {pinningId === link.id ? <Loader2 className="h-4 w-4 animate-spin" /> : link.isPinned ? <PinOff className="h-4 w-4 text-primary" /> : <Pin className="h-4 w-4" />}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>{link.isPinned ? "Unpin" : "Pin"}</TooltipContent>
                              </Tooltip>

                              {/* Copy */}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleCopy(link)}>
                                    {copiedId === link.id ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Copy</TooltipContent>
                              </Tooltip>

                              <QRDialog slug={link.slug} shortUrl={shortUrl} />

                              {/* Analytics */}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="icon" variant="ghost" className="h-8 w-8" asChild>
                                    <Link href={`/dashboard/${link.id}`}><LineChart className="h-4 w-4" /></Link>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Analytics</TooltipContent>
                              </Tooltip>

                              {/* ⋯ grouped actions */}
                              <ActionsMenu link={link} />
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* ── Mobile cards ── */}
              <div className="sm:hidden space-y-3">
                {filtered.map((link) => {
                  const shortUrl = `${appUrl}/${link.slug}`;
                  return (
                    <div key={link.id} data-testid="link-row"
                      className={`border rounded-lg p-3 space-y-2 ${link.isPinned ? "border-primary/30 bg-primary/5" : ""}`}>
                      {/* Top row: slug + clicks */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <a href={shortUrl} target="_blank" rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1 font-medium text-sm w-fit">
                            {link.isPinned && <Pin className="h-3 w-3 rotate-45 shrink-0" />}
                            /{link.slug}
                            <ExternalLink className="h-3 w-3 shrink-0" />
                          </a>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{link.url}</p>
                          {link.notes && <p className="text-xs text-muted-foreground/60 truncate mt-0.5 italic">{link.notes}</p>}
                          {link.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {link.tags.map(({ tag }) => (
                                <span key={tag.id}
                                  className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium text-white"
                                  style={{ backgroundColor: tag.color }}>
                                  {tag.name}
                                </span>
                              ))}
                            </div>
                          )}
                          {link.folder && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 mt-0.5">
                              <span className="h-1.5 w-1.5 rounded-full inline-block" style={{ backgroundColor: link.folder.color }} />
                              {link.folder.name}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <Badge variant="secondary">{link.clicks} clicks</Badge>
                          {!link.isActive && <Badge variant="destructive" className="text-xs">Inactive</Badge>}
                          <ExpiryText expiresAt={link.expiresAt} />
                        </div>
                      </div>

                      {/* Bottom row: date + actions */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {new Date(link.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                        <div className="flex items-center gap-1">
                          {/* Pin */}
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handlePin(link.id)} disabled={pinningId === link.id || isPending}>
                            {pinningId === link.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : link.isPinned ? <PinOff className="h-3.5 w-3.5 text-primary" /> : <Pin className="h-3.5 w-3.5" />}
                          </Button>
                          {/* Copy */}
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleCopy(link)}>
                            {copiedId === link.id ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                          </Button>
                          {/* Analytics */}
                          <Button size="icon" variant="ghost" className="h-7 w-7" asChild>
                            <Link href={`/dashboard/${link.id}`}><LineChart className="h-3.5 w-3.5" /></Link>
                          </Button>
                          {/* ⋯ grouped actions */}
                          <ActionsMenu link={link} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </TooltipProvider>
          )}
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  disabled={page <= 1}
                  onClick={() => goToPage(page - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce<(number | "…")[]>((acc, p, i, arr) => {
                    if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === "…" ? (
                      <span key={`ellipsis-${i}`} className="px-1 text-xs text-muted-foreground">…</span>
                    ) : (
                      <Button
                        key={p}
                        variant={p === page ? "default" : "outline"}
                        size="sm"
                        className="h-8 w-8 p-0 text-xs"
                        onClick={() => goToPage(p as number)}
                      >
                        {p}
                      </Button>
                    )
                  )}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  disabled={page >= totalPages}
                  onClick={() => goToPage(page + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
