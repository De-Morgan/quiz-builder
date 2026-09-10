"use client";

import Link from "next/link";

import { useAuth } from "@/app/providers";
import { routes } from "@/lib/endpoints";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
          <ThemeModeToggle />
        </div>
      </nav>
    </header>
  );
}

function ThemeModeToggle() {
  const { setTheme } = useTheme();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
