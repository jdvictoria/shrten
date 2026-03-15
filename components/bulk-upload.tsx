"use client";

import { useState, useTransition } from "react";
import Papa from "papaparse";
import { CheckCircle, FileUp, Loader2, Upload, X, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

type RowResult = {
  url: string;
  slug?: string;
  status: "pending" | "success" | "error";
  shortUrl?: string;
  error?: string;
};

export function BulkUpload() {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<RowResult[]>([]);
  const [isPending, startTransition] = useTransition();

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete(result) {
        const parsed: RowResult[] = result.data
          .map((row) => ({
            url: row.url ?? row.URL ?? "",
            slug: row.slug ?? row.SLUG ?? undefined,
            status: "pending" as const,
          }))
          .filter((r) => r.url.trim());
        setRows(parsed);
      },
    });
    e.target.value = "";
  }

  function handleUpload() {
    startTransition(async () => {
      const updated = [...rows];

      for (let i = 0; i < updated.length; i++) {
        if (updated[i].status !== "pending") continue;

        try {
          const res = await fetch("/api/bulk-shorten", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: updated[i].url, slug: updated[i].slug }),
          });
          const data = await res.json();

          updated[i] = res.ok
            ? { ...updated[i], status: "success", shortUrl: data.shortUrl }
            : { ...updated[i], status: "error", error: data.error ?? "Failed" };
        } catch {
          updated[i] = { ...updated[i], status: "error", error: "Network error" };
        }

        setRows([...updated]);
      }

      const ok = updated.filter((r) => r.status === "success").length;
      toast.success(`${ok} of ${updated.length} links created`);
    });
  }

  function handleOpenChange(v: boolean) {
    setOpen(v);
    if (!v) setRows([]);
  }

  const pendingCount = rows.filter((r) => r.status === "pending").length;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5">
          <Upload className="h-4 w-4" />
          Bulk Import
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg bg-card text-card-foreground shadow">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Bulk Import
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* CSV format example */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Expected format</p>
            <div className="rounded-md border border-input overflow-hidden text-xs font-mono">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted border-b border-input">
                    <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">url</th>
                    <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">
                      slug <span className="font-normal text-muted-foreground/60">(optional)</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-input">
                    <td className="px-3 py-1.5 text-foreground">https://example.com/long-path</td>
                    <td className="px-3 py-1.5 text-foreground">my-link</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-1.5 text-foreground">https://another.com/article</td>
                    <td className="px-3 py-1.5 text-muted-foreground/50"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* File picker */}
          <label className="block">
            <input type="file" accept=".csv" className="sr-only" onChange={handleFile} />
            <Button className="w-full gap-2" asChild>
              <span className="cursor-pointer">
                <FileUp className="h-4 w-4" />
                Choose CSV
              </span>
            </Button>
          </label>

          {rows.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground flex-1">{rows.length} rows loaded</span>
              <Button
                size="sm"
                onClick={handleUpload}
                disabled={isPending || pendingCount === 0}
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  `Create ${pendingCount} link${pendingCount !== 1 ? "s" : ""}`
                )}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setRows([])}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {rows.length > 0 && (
            <div className="space-y-1 max-h-56 overflow-auto rounded border p-2">
              {rows.map((row, i) => (
                <div key={i} className="flex items-center gap-2 text-sm py-1">
                  {row.status === "pending" && (
                    <div className="h-4 w-4 rounded-full border-2 border-muted shrink-0" />
                  )}
                  {row.status === "success" && (
                    <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                  )}
                  {row.status === "error" && (
                    <XCircle className="h-4 w-4 text-destructive shrink-0" />
                  )}
                  <span className="flex-1 truncate text-muted-foreground">{row.url}</span>
                  {row.shortUrl && (
                    <span className="text-primary font-medium shrink-0">
                      /{row.shortUrl.split("/").pop()}
                    </span>
                  )}
                  {row.error && (
                    <span className="text-destructive text-xs shrink-0">{row.error}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
