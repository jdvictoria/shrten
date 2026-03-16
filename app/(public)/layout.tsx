import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="flex-1 overflow-y-auto flex flex-col items-center justify-center">
        {children}
      </main>
      <Footer />
    </>
  );
}
