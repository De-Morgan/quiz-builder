"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/app/providers";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/lib/endpoints";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "anon") {
      router.replace(routes.login);
    }
  }, [status, router]);

  if (status === "authed") {
    return <>{children}</>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-3 px-4 py-8" aria-busy="true">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}
