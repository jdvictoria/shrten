import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";
import { ArrowLeft, Link2, Users } from "lucide-react";
import { auth } from "@/auth";
import { getTeam, getTeamLinks, getMyRole } from "@/lib/team-actions";
import { getFolders } from "@/lib/folder-actions";
import { getTags } from "@/lib/tag-actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TeamActions } from "@/components/team-actions";
import { LinksTable } from "@/components/links-table";

export default async function TeamPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ joined?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const { id } = await params;
  const { joined } = await searchParams;

  const [team, myRole, teamLinks, folders, tags] = await Promise.all([
    getTeam(id),
    getMyRole(id),
    getTeamLinks(id),
    getFolders(),
    getTags(),
  ]);

  if (!team || !myRole) notFound();

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto")?.split(",")[0] ?? "http";
  const appUrl = `${proto}://${host}`;

  const folderProps = folders.map(({ id, name, color }) => ({ id, name, color }));
  const tagProps = tags.map(({ id, name, color }) => ({ id, name, color }));

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button variant="ghost" size="sm" asChild className="-ml-2 mb-4">
        <Link href="/dashboard/teams">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Teams
        </Link>
      </Button>

      {joined && (
        <div className="mb-6 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
          Welcome to the team!
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">{team.name}</h1>
          <p className="text-muted-foreground font-mono text-sm mt-0.5">
            @{team.slug}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            {team.members.length} member{team.members.length !== 1 ? "s" : ""}
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Link2 className="h-4 w-4" />
            {team._count.links} link{team._count.links !== 1 ? "s" : ""}
          </div>
          <Badge
            variant={
              myRole === "admin"
                ? "default"
                : myRole === "editor"
                ? "secondary"
                : "outline"
            }
          >
            {myRole}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="members">
        <TabsList className="mb-6">
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="links">Links</TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                Manage who has access to this team workspace.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TeamActions
                teamId={team.id}
                myRole={myRole}
                members={team.members.map((m) => ({
                  id: m.id,
                  role: m.role as "admin" | "editor" | "viewer",
                  user: {
                    id: m.user.id,
                    name: m.user.name,
                    email: m.user.email,
                    image: m.user.image,
                  },
                }))}
                invitations={team.invitations.map((inv) => ({
                  id: inv.id,
                  email: inv.email,
                  role: inv.role as "admin" | "editor" | "viewer",
                  token: inv.token,
                  expiresAt: inv.expiresAt,
                }))}
                currentUserId={session.user.id!}
                appUrl={appUrl}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="links">
          {teamLinks.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12 text-muted-foreground">
                No links in this team yet.
              </CardContent>
            </Card>
          ) : (
            <LinksTable
              links={teamLinks.map((l) => ({
                ...l,
                notes: l.notes ?? null,
                folder: l.folder ?? null,
              }))}
              folders={folderProps}
              tags={tagProps}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
