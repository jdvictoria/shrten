import type { Metadata } from "next";
import { ShortenForm } from "@/components/shorten-form";

export const metadata: Metadata = {
  title: "shrten — Free URL Shortener",
  description:
    "Shorten any URL in seconds for free. No account required. Track clicks and manage links with shrten.",
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <div className="flex flex-col items-center w-full px-4 pt-10 pb-16">
      {/* Hero */}
      <div className="text-center mb-8 w-full max-w-lg mx-auto">
        <h1 className="text-[44px] sm:text-[56px] font-extrabold tracking-[-0.03em] leading-[1.05] mb-3 text-foreground">
          Shorten.
          <br />
          <span className="font-extralight text-muted-foreground">
            Share without the mess.
          </span>
        </h1>

        <p className="text-xs text-muted-foreground/50 tracking-wide">
          Free forever · No account · Click analytics · Custom aliases
        </p>
      </div>

      <ShortenForm />
    </div>
  );
}
