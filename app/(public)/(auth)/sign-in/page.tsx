import { Suspense } from "react";
import Link from "next/link";
import { Github } from "lucide-react";
import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CredentialsForm } from "@/components/credentials-form";

export default function SignInPage() {
  return (
    <div className="h-full flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>Sign in to manage your links</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* GitHub OAuth — form action triggers server-side signIn */}
          <form
            action={async () => {
              "use server";
              await signIn("github", { redirectTo: "/dashboard" });
            }}
          >
            <Button type="submit" variant="outline" className="w-full gap-2">
              <Github className="h-4 w-4" />
              Continue with GitHub
            </Button>
          </form>

          <div className="relative flex items-center gap-2">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">or</span>
            <Separator className="flex-1" />
          </div>

          <Suspense>
            <CredentialsForm />
          </Suspense>

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/sign-up" className="text-primary hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
