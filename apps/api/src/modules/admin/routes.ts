import { getDb, schema } from "@baro/db";
import { adminStatsSchema } from "@baro/shared/schemas/admin";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { count, gte, sql } from "drizzle-orm";
import { type AdminEnv, requireAdmin } from "./middleware";

const statsRoute = createRoute({
  method: "get",
  path: "/stats",
  // ponytail: middleware lives on the route config (not a chained .use()) because
  // OpenAPIHono.use() widens the return type to plain Hono and drops .openapi().
  middleware: [requireAdmin] as const,
  responses: {
    200: {
      description: "Admin dashboard stats",
      content: { "application/json": { schema: adminStatsSchema } },
    },
  },
});

export const adminRoutes = new OpenAPIHono<AdminEnv>().openapi(
  statsRoute,
  async (c) => {
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
        totalUsers: total?.value ?? 0,
        signupsByDay: rows.map((r) => ({ day: r.day, count: Number(r.count) })),
      },
      200,
    );
  },
);
