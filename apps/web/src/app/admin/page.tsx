"use client";

import type { AdminStats } from "@baro/shared/schemas/admin";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SignupChart } from "@/features/admin/signup-chart";
import { StatsCards } from "@/features/admin/stats-cards";
import { UserTable } from "@/features/admin/user-table";
import { api } from "@/lib/api";
import { useSession } from "@/lib/auth-client";

export default function AdminPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [stats, setStats] = useState<AdminStats | null>(null);

  const isAdmin = session?.user.role === "admin";

  useEffect(() => {
    if (isPending) return;
    if (!isAdmin) {
      router.replace("/");
      return;
    }
    api.api.admin.stats
      .$get()
      .then((res) => (res.ok ? res.json() : null))
      .then(setStats)
      .catch(() => setStats(null));
  }, [isPending, isAdmin, router]);

  if (isPending || !isAdmin) return null;

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <h1 className="text-xl font-semibold">Admin</h1>
      {stats && (
        <>
          <StatsCards stats={stats} />
          <SignupChart stats={stats} />
        </>
      )}
      <UserTable />
    </main>
  );
}
