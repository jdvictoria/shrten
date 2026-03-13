import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { getMyTeams } from "@/lib/team-actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link2, Plus, Users } from "lucide-react";

export default async function TeamsPage({
  searchParams,
}: {
  searchParams: Promise<{ joined?: string; error?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const { joined, error } = await searchParams;
  const teams = await getMyTeams();

  const roleBadgeVariant: Record<
    string,
    "default" | "secondary" | "outline"
  > = {
    admin: "default",
    editor: "secondary",
    viewer: "outline",
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Teams</h1>
          <p className="text-muted-foreground mt-1">
            Collaborate with your team on shared links
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/teams/new">
            <Plus className="h-4 w-4 mr-2" />
            New Team
          </Link>
        </Button>
      </div>

      {joined && (
        <div className="mb-6 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
          You have successfully joined the team.
        </div>
      )}
      {error && (
        <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error === "invite-failed"
            ? "Failed to accept invitation. It may have expired."
            : "Invalid invitation link."}
        </div>
      )}

      {teams.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No teams yet</h2>
            <p className="text-muted-foreground mb-6">
              Create a team to collaborate with others on shared links.
            </p>
            <Button asChild>
              <Link href="/dashboard/teams/new">
                <Plus className="h-4 w-4 mr-2" />
                Create your first team
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {teams.map((team) => (
            <Link key={team.id} href={`/dashboard/teams/${team.id}`}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{team.name}</CardTitle>
                      <CardDescription className="mt-0.5 font-mono text-xs">
                        @{team.slug}
                      </CardDescription>
                    </div>
                    <Badge variant={roleBadgeVariant[team.role] ?? "outline"}>
                      {team.role}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      {team._count.members} member
                      {team._count.members !== 1 ? "s" : ""}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Link2 className="h-3.5 w-3.5" />
                      {team._count.links} link
                      {team._count.links !== 1 ? "s" : ""}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
