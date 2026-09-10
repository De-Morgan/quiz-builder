"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/Spinner";
import type { ApiError } from "@/lib/api";
import { Eye, EyeOff } from "lucide-react";

type Mode = "login" | "register";

const schema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormValues = z.infer<typeof schema>;

const copy = {
  login: {
    title: "Log in",
    description: "Access your quizzes.",
    submit: "Log in",
    altPrompt: "Need an account?",
    altLabel: "Register",
    altHref: "/register",
  },
  register: {
    title: "Create an account",
    description: "Start building and sharing quizzes.",
    submit: "Register",
    altPrompt: "Already have an account?",
    altLabel: "Log in",
    altHref: "/login",
  },
} as const;

export function AuthForm({
  mode,
  onSubmit,
}: {
  mode: Mode;
  onSubmit: (email: string, password: string) => Promise<void>;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const text = copy[mode];
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const toggleShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  const submit = form.handleSubmit(async ({ email, password }) => {
    setFormError(null);
    try {
      await onSubmit(email, password);
    } catch (err) {
      const apiError = err as Partial<ApiError>;
      setFormError(apiError?.message ?? "Something went wrong. Try again.");
    }
  });

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm items-center px-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{text.title}</CardTitle>
          <CardDescription>{text.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={submit} noValidate className="grid gap-4">
              {formError ? (
                <Alert variant="destructive">
                  <AlertTitle>Unable to continue</AlertTitle>
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              ) : null}

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          autoComplete={
                            mode === "login"
                              ? "current-password"
                              : "new-password"
                          }
                          className="pr-10"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={toggleShowPassword}
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
                          }
                          aria-pressed={showPassword}
                          className="text-muted-foreground absolute inset-y-0 right-0 h-full px-3 hover:bg-transparent"
                        >
                          {showPassword ? <EyeOff /> : <Eye />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Spinner className="size-4" />
                    {text.submit}
                  </>
                ) : (
                  text.submit
                )}
              </Button>

              <p className="text-muted-foreground text-center text-sm">
                {text.altPrompt}{" "}
                <Link
                  href={text.altHref}
                  className="text-foreground underline underline-offset-4"
                >
                  {text.altLabel}
                </Link>
              </p>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
