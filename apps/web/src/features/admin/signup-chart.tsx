import type { AdminStats } from "@baro/shared/schemas/admin";
import { Card } from "@/components/ui/card";

const W = 560;
const H = 120;
const GAP = 2;

export function SignupChart({ stats }: { stats: AdminStats }) {
  // 14-day continuous axis (fill missing days with 0)
  const byDay = new Map(stats.signupsByDay.map((d) => [d.day, d.count]));
  const days: { day: string; count: number }[] = [];
  const now = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({ day: key, count: byDay.get(key) ?? 0 });
  }

  const max = Math.max(1, ...days.map((d) => d.count));
  const maxIdx = days.findIndex((d) => d.count === max);
  const barW = (W - GAP * (days.length - 1)) / days.length;

  return (
    <Card>
      <p className="text-sm text-zinc-500">Signups — last 14 days</p>
      <svg
        viewBox={`0 0 ${W} ${H + 20}`}
        className="mt-2 w-full"
        role="img"
        aria-label={`Daily signups for the last 14 days, peak ${max}`}
      >
        {days.map((d, i) => {
          const h = Math.max(2, (d.count / max) * H);
          const x = i * (barW + GAP);
          const isLabeled = i === maxIdx || i === days.length - 1;
          return (
            <g key={d.day}>
              <rect
                x={x}
                y={H - h}
                width={barW}
                height={h}
                rx={3}
                className="fill-zinc-800 dark:fill-zinc-200"
              >
                <title>{`${d.day}: ${d.count}`}</title>
              </rect>
              {isLabeled && d.count > 0 && (
                <text
                  x={x + barW / 2}
                  y={H - h - 4}
                  textAnchor="middle"
                  className="fill-zinc-500 text-[10px] tabular-nums"
                >
                  {d.count}
                </text>
              )}
              {(i === 0 || i === days.length - 1) && (
                <text
                  x={x + barW / 2}
                  y={H + 14}
                  textAnchor="middle"
                  className="fill-zinc-400 text-[10px]"
                >
                  {d.day.slice(5)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </Card>
  );
}
