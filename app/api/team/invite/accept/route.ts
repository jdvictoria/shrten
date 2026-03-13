import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { acceptInvitation } from "@/lib/team-actions";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    redirect("/dashboard/teams?error=invalid");
  }

  const session = await auth();
  if (!session?.user) {
    redirect(
      `/sign-in?callbackUrl=${encodeURIComponent(`/api/team/invite/accept?token=${token}`)}`
    );
  }

  const result = await acceptInvitation(token);
  if (!result.success) {
    redirect("/dashboard/teams?error=invite-failed");
  }

  redirect(`/dashboard/teams/${result.data.teamId}?joined=1`);
}
