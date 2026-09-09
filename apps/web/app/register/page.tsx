"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/app/providers";
import { AuthForm } from "@/components/AuthForm";
import { Spinner } from "@/components/Spinner";
import { routes } from "@/lib/endpoints";

export default function RegisterPage() {
  const { status, register } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "authed") {
      router.replace(routes.home);
    }
  }, [status, router]);

  if (status !== "anon") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="size-6" />
      </div>
    );
  }

  return <AuthForm mode="register" onSubmit={register} />;
}
