"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/app/providers";
import { Spinner } from "@/components/Spinner";
import { routes } from "@/lib/endpoints";

export default function Home() {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "authed") {
      router.replace(routes.dashboard);
    } else if (status === "anon") {
      router.replace(routes.login);
    }
  }, [status, router]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spinner className="size-6" />
    </div>
  );
}
