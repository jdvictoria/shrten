import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PasswordForm } from "@/components/password-form";

export default async function PasswordPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const link = await prisma.link.findUnique({
    where: { slug },
    select: { passwordHash: true },
  });

  if (!link?.passwordHash) notFound();

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4">
      <PasswordForm slug={slug} />
    </div>
  );
}
