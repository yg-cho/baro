import { getDb, schema } from "@baro/db";
import { adminStatsSchema } from "@baro/shared/schemas/admin";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { count, gte, sql } from "drizzle-orm";
import { type AdminEnv, requireAdmin } from "./middleware";

const statsRoute = createRoute({
  method: "get",
  path: "/stats",
  responses: {
    200: {
      description: "Admin dashboard stats",
      content: { "application/json": { schema: adminStatsSchema } },
    },
  },
});

const adminApp = new OpenAPIHono<AdminEnv>();
// Router-level guard: every route added to this module is admin-only.
// NOTE: .use() must be a separate statement — chaining it widens the type
// and drops .openapi() (hono types). Do not inline into the chain.
adminApp.use("/*", requireAdmin);

export const adminRoutes = adminApp.openapi(statsRoute, async (c) => {
  const db = getDb();
  const [total] = await db.select({ value: count() }).from(schema.user);

  const since = new Date(Date.now() - 13 * 24 * 60 * 60 * 1000);
  since.setHours(0, 0, 0, 0);

  const rows = await db
    .select({
      day: sql<string>`to_char(${schema.user.createdAt}, 'YYYY-MM-DD')`,
      count: count(),
    })
    .from(schema.user)
    .where(gte(schema.user.createdAt, since))
    .groupBy(sql`to_char(${schema.user.createdAt}, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${schema.user.createdAt}, 'YYYY-MM-DD')`);

  return c.json(
    {
      totalUsers: Number(total?.value ?? 0),
      signupsByDay: rows.map((r) => ({ day: r.day, count: Number(r.count) })),
    },
    200,
  );
});
