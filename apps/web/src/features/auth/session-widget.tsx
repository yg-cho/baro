"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { signOut, useSession } from "@/lib/auth-client";

export function SessionWidget() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  if (isPending) return <p className="text-sm text-zinc-500">…</p>;

  if (!session) {
    return (
      <div className="flex gap-2">
        <Link href="/login">
          <Button variant="outline">Sign in</Button>
        </Link>
        <Link href="/signup">
          <Button>Sign up</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm">{session.user.email}</span>
      <Button
        variant="outline"
        onClick={async () => {
          await signOut();
          router.refresh();
        }}
      >
        Sign out
      </Button>
    </div>
  );
}
