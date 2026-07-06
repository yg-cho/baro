import type { AdminStats } from "@baro/shared/schemas/admin";
import { Card } from "@/components/ui/card";

export function StatsCards({ stats }: { stats: AdminStats }) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 6);
  const cutoffKey = cutoff.toISOString().slice(0, 10);
  const last7 = stats.signupsByDay
    .filter((d) => d.day >= cutoffKey)
    .reduce((s, d) => s + d.count, 0);
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Card>
        <p className="text-sm text-zinc-500">Total users</p>
        <p className="mt-1 text-3xl font-semibold tabular-nums">
          {stats.totalUsers}
        </p>
      </Card>
      <Card>
        <p className="text-sm text-zinc-500">Signups (last 7 days)</p>
        <p className="mt-1 text-3xl font-semibold tabular-nums">{last7}</p>
      </Card>
    </div>
  );
}
