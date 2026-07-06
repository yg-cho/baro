"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { signIn, signUp } from "@/lib/auth-client";

type Mode = "login" | "signup";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [social, setSocial] = useState({ google: false, github: false });

  useEffect(() => {
    api.api.auth.providers
      .$get()
      .then((res) => res.json())
      .then((p) => setSocial({ google: p.google, github: p.github }))
      .catch(() => {});
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));

    const result =
      mode === "signup"
        ? await signUp.email({
            name: String(form.get("name")),
            email,
            password,
          })
        : await signIn.email({ email, password });

    setPending(false);
    if (result.error) {
      setError(result.error.message ?? "Something went wrong");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <Card className="w-full max-w-sm">
      <h1 className="mb-4 text-lg font-semibold">
        {mode === "login" ? "Sign in to baro" : "Create your account"}
      </h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        {mode === "signup" && (
          <div className="flex flex-col gap-1">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required />
          </div>
        )}
        <div className="flex flex-col gap-1">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            minLength={8}
            required
          />
        </div>
        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" disabled={pending}>
          {mode === "login" ? "Sign in" : "Sign up"}
        </Button>
      </form>

      {(social.google || social.github) && (
        <div className="mt-4 flex flex-col gap-2">
          {social.google && (
            <Button
              variant="outline"
              onClick={() => signIn.social({ provider: "google" })}
            >
              Continue with Google
            </Button>
          )}
          {social.github && (
            <Button
              variant="outline"
              onClick={() => signIn.social({ provider: "github" })}
            >
              Continue with GitHub
            </Button>
          )}
        </div>
      )}

      <p className="mt-4 text-sm text-zinc-500">
        {mode === "login" ? (
          <>
            No account?{" "}
            <Link className="underline" href="/signup">
              Sign up
            </Link>
            {" · "}
            <Link className="underline" href="/forgot-password">
              Forgot password
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link className="underline" href="/login">
              Sign in
            </Link>
          </>
        )}
      </p>
    </Card>
  );
}
