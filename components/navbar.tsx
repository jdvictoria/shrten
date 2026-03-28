import Link from "next/link";
import { LayoutDashboard, LogOut, Users } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutAction } from "@/lib/auth-actions";

export async function Navbar() {
  const session = await auth();

  return (
    <nav className="border-b border-border/60 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/70 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between max-w-6xl">
        <Link
          href="/"
          className="flex items-center tracking-tight text-[1.1rem] leading-none"
        >
          <span className="font-black text-foreground">shrt</span>
          <span className="font-extralight text-muted-foreground">en</span>
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 h-9 rounded-xl">
                  {session.user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={session.user.image}
                      alt={session.user.name ?? ""}
                      className="h-6 w-6 rounded-full object-cover ring-2 ring-primary/20"
                    />
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
                      {(session.user.name ?? session.user.email ?? "?")[0].toUpperCase()}
                    </div>
                  )}
                  <span className="hidden sm:inline text-sm max-w-32 truncate">
                    {session.user.name ?? session.user.email}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 rounded-2xl p-1.5">
                <DropdownMenuLabel className="font-normal px-2 py-1.5">
                  <div className="flex flex-col space-y-0.5">
                    <p className="text-sm font-medium leading-none">{session.user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground truncate">
                      {session.user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem asChild className="rounded-xl">
                  <Link href="/dashboard" className="cursor-pointer">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-xl">
                  <Link href="/dashboard/teams" className="cursor-pointer">
                    <Users className="h-4 w-4" />
                    Teams
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem asChild className="rounded-xl">
                  <form action={signOutAction} className="w-full">
                    <button
                      type="submit"
                      className="flex w-full items-center gap-2 text-destructive"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </form>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button size="sm" asChild className="rounded-xl">
              <Link href="/sign-in">Get started</Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
