"use client";

import Link from "next/link";

import { useAuth } from "@/app/providers";
import { Button } from "@/components/ui/button";
import { routes } from "@/lib/endpoints";

export function Nav() {
  const { status, user, logout } = useAuth();

  return (
    <header className="border-b">
      <nav className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
        <Link href={routes.home} className="font-semibold">
          Quiz Builder
        </Link>
        <div className="flex items-center gap-1">
          {status === "authed" ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href={routes.newQuiz}>New quiz</Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                aria-label={user ? `Log out ${user.email}` : "Log out"}
              >
                Log out
              </Button>
            </>
          ) : status === "anon" ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href={routes.login}>Log in</Link>
              </Button>
              <Button asChild variant="link" size="sm">
                <Link href={routes.register}>Register</Link>
              </Button>
            </>
          ) : null}
        </div>
      </nav>
    </header>
  );
}
