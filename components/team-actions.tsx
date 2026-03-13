"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Check, Copy, Loader2, Mail, Trash2 } from "lucide-react";
import {
  inviteMember,
  updateMemberRole,
  removeMember,
} from "@/lib/team-actions";
import { toast } from "sonner";

type TeamRole = "admin" | "editor" | "viewer";

interface TeamMember {
  id: string;
  role: TeamRole;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
}

interface TeamInvitation {
  id: string;
  email: string;
  role: TeamRole;
  token: string;
  expiresAt: Date;
}

interface TeamActionsProps {
  teamId: string;
  myRole: TeamRole;
  members: TeamMember[];
  invitations: TeamInvitation[];
  currentUserId: string;
  appUrl: string;
}

const roleBadgeVariant: Record<TeamRole, "default" | "secondary" | "outline"> =
  {
    admin: "default",
    editor: "secondary",
    viewer: "outline",
  };

export function TeamActions({
  teamId,
  myRole,
  members: initialMembers,
  invitations: initialInvitations,
  currentUserId,
  appUrl,
}: TeamActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [members, setMembers] = useState(initialMembers);
  const [invitations, setInvitations] = useState(initialInvitations);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<TeamRole>("editor");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const isAdmin = myRole === "admin";

  function handleInvite() {
    if (!inviteEmail.trim()) return;
    startTransition(async () => {
      const res = await inviteMember(teamId, inviteEmail.trim(), inviteRole);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      const inviteUrl = `${appUrl}/api/team/invite/accept?token=${res.data.token}`;
      await navigator.clipboard.writeText(inviteUrl);
      setCopiedToken(res.data.token);
      setTimeout(() => setCopiedToken(null), 3000);
      toast.success("Invite link copied to clipboard!");
      setInviteEmail("");
      // refresh invitations list
      router.refresh();
    });
  }

  function handleRoleChange(memberId: string, role: TeamRole) {
    startTransition(async () => {
      const res = await updateMemberRole(teamId, memberId, role);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role } : m))
      );
      toast.success("Role updated");
    });
  }

  function handleRemove(memberId: string) {
    setRemovingId(memberId);
    startTransition(async () => {
      const res = await removeMember(teamId, memberId);
      if (!res.success) {
        toast.error(res.error);
        setRemovingId(null);
        return;
      }
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      toast.success("Member removed");
      setRemovingId(null);
    });
  }

  async function copyInviteLink(token: string) {
    const inviteUrl = `${appUrl}/api/team/invite/accept?token=${token}`;
    await navigator.clipboard.writeText(inviteUrl);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
    toast.success("Invite link copied!");
  }

  return (
    <div className="space-y-8">
      {/* Members list */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Members ({members.length})
        </h3>
        <div className="space-y-2">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between gap-3 rounded-lg border px-4 py-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                {member.user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={member.user.image}
                    alt={member.user.name ?? ""}
                    className="h-8 w-8 rounded-full shrink-0"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0 text-xs font-medium">
                    {(member.user.name ?? member.user.email ?? "?")[0].toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {member.user.name ?? member.user.email}
                    {member.user.id === currentUserId && (
                      <span className="text-muted-foreground font-normal ml-1">
                        (you)
                      </span>
                    )}
                  </p>
                  {member.user.name && (
                    <p className="text-xs text-muted-foreground truncate">
                      {member.user.email}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isAdmin && member.user.id !== currentUserId ? (
                  <Select
                    value={member.role}
                    onValueChange={(v) =>
                      handleRoleChange(member.id, v as TeamRole)
                    }
                    disabled={isPending}
                  >
                    <SelectTrigger className="h-7 w-24 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant={roleBadgeVariant[member.role]}>
                    {member.role}
                  </Badge>
                )}

                {isAdmin && member.user.id !== currentUserId && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemove(member.id)}
                    disabled={removingId === member.id || isPending}
                  >
                    {removingId === member.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invite section (admin only) */}
      {isAdmin && (
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Invite Member
          </h3>
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex gap-2">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="invite-email">Email address</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="colleague@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                />
              </div>
              <div className="w-32 space-y-1.5">
                <Label>Role</Label>
                <Select
                  value={inviteRole}
                  onValueChange={(v) => setInviteRole(v as TeamRole)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              onClick={handleInvite}
              disabled={isPending || !inviteEmail.trim()}
              className="w-full"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Mail className="h-4 w-4 mr-2" />
              )}
              Generate Invite Link
            </Button>
            <p className="text-xs text-muted-foreground">
              The invite link will be copied to your clipboard. Share it with
              your colleague. Links expire in 7 days.
            </p>
          </div>
        </div>
      )}

      {/* Pending invitations */}
      {isAdmin && invitations.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Pending Invitations ({invitations.length})
          </h3>
          <div className="space-y-2">
            {invitations.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between gap-3 rounded-lg border px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{inv.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Role: {inv.role} &middot; Expires{" "}
                    {new Date(inv.expiresAt).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs shrink-0"
                  onClick={() => copyInviteLink(inv.token)}
                >
                  {copiedToken === inv.token ? (
                    <Check className="h-3.5 w-3.5 mr-1 text-green-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 mr-1" />
                  )}
                  Copy link
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
