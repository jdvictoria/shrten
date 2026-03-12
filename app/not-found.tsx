import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center gap-4">
      <SearchX className="h-12 w-12 text-muted-foreground" />
      <h1 className="text-2xl font-bold">Link Not Found</h1>
      <p className="text-muted-foreground">
        This short link doesn&apos;t exist or has been removed.
      </p>
      <Button asChild>
        <Link href="/">Go Home</Link>
      </Button>
    </div>
  );
}
