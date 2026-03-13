import Link from "next/link";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LinkExpired() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center gap-4">
      <Clock className="h-12 w-12 text-muted-foreground" />
      <h1 className="text-2xl font-bold">Link Expired</h1>
      <p className="text-muted-foreground text-center max-w-sm">
        This short link has passed its expiration date and is no longer active.
      </p>
      <Button asChild>
        <Link href="/">Create a new link</Link>
      </Button>
    </div>
  );
}
