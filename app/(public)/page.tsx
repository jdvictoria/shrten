import { ShortenForm } from "@/components/shorten-form";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16">
      <div className="text-center mb-10 space-y-4">
        <Badge variant="secondary" className="text-xs">
          Fast &amp; Serverless
        </Badge>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          Shorten any URL
          <br />
          in seconds
        </h1>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          Create short, memorable links instantly. Track clicks and manage your
          links from one dashboard.
        </p>
      </div>

      <ShortenForm />
    </div>
  );
}
