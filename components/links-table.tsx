"use client";

import { useState, useTransition } from "react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Check, Copy, ExternalLink, LineChart, Loader2, Trash2 } from "lucide-react";
import { QRDialog } from "@/components/qr-dialog";
import { deleteLink } from "@/lib/actions";
import { getAppUrl } from "@/lib/utils";
import { toast } from "sonner";

type LinkRow = {
  id: string;
  slug: string;
  url: string;
  clicks: number;
  expiresAt: Date | null;
  createdAt: Date;
};

function ExpiryBadge({ expiresAt }: { expiresAt: Date | null }) {
  if (!expiresAt) return null;
  const expired = expiresAt < new Date();
  return (
    <Badge variant={expired ? "destructive" : "outline"} className="text-xs">
      {expired ? "Expired" : `Expires ${new Date(expiresAt).toLocaleDateString()}`}
    </Badge>
  );
}

export function LinksTable({ links }: { links: LinkRow[] }) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const appUrl = getAppUrl();

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
      else toast.success("Link deleted");
      setDeletingId(null);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Links</CardTitle>
        <CardDescription>
          {links.length} link{links.length !== 1 ? "s" : ""} total
        </CardDescription>
      </CardHeader>
      <CardContent>
        {links.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No links yet. Create your first short URL!
          </div>
        ) : (
          <TooltipProvider>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Short URL</TableHead>
                  <TableHead>Original URL</TableHead>
                  <TableHead className="text-center w-20">Clicks</TableHead>
                  <TableHead className="w-40">Status</TableHead>
                  <TableHead className="w-28">Created</TableHead>
                  <TableHead className="text-right w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {links.map((link) => {
                  const shortUrl = `${appUrl}/${link.slug}`;
                  return (
                    <TableRow key={link.id}>
                      <TableCell className="font-medium">
                        <a
                          href={shortUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1 w-fit"
                        >
                          /{link.slug}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </TableCell>

                      <TableCell className="max-w-xs">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="block truncate text-muted-foreground text-sm cursor-default">
                              {link.url}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-sm break-all">
                            {link.url}
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>

                      <TableCell className="text-center">
                        <Badge variant="secondary">{link.clicks}</Badge>
                      </TableCell>

                      <TableCell>
                        <ExpiryBadge expiresAt={link.expiresAt} />
                      </TableCell>

                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(link.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => handleCopy(link)}
                              >
                                {copiedId === link.id ? (
                                  <Check className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Copy</TooltipContent>
                          </Tooltip>

                          <QRDialog slug={link.slug} shortUrl={shortUrl} />

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="icon" variant="ghost" className="h-8 w-8" asChild>
                                <Link href={`/dashboard/${link.id}`}>
                                  <LineChart className="h-4 w-4" />
                                </Link>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Analytics</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => handleDelete(link.id)}
                                disabled={deletingId === link.id || isPending}
                              >
                                {deletingId === link.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TooltipProvider>
        )}
      </CardContent>
    </Card>
  );
}
