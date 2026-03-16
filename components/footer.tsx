import { Coffee, Github } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/60 mt-auto py-5">
      <div className="container mx-auto px-4 max-w-6xl flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          © 2026 jdvictoria. All rights reserved.
        </p>
        <div className="flex items-center gap-3">
          <a
            href="https://ko-fi.com/B0B71W3AVW"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Support on Ko-fi"
            className="text-[#f5b073] hover:text-[#f5b073]/70 transition-colors"
          >
            <Coffee className="h-4 w-4" />
          </a>
          <a
            href="https://github.com/jdvictoria"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            <Github className="h-4 w-4" />
          </a>
        </div>
      </div>
    </footer>
  );
}
