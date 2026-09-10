import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { routes } from "@/lib/endpoints";
import { Button } from "../ui/button";

export function DashboardHeader() {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Your quizzes
        </h1>
        <p className="text-muted-foreground text-sm">
          Create quizzes, publish them, and share the link with anyone.
        </p>
      </div>
      <Button asChild>
        <Link href={routes.newQuiz}>
          <PlusIcon />
          New quiz
        </Link>
      </Button>
    </header>
  );
}
