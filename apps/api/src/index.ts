import { getDb, runMigrations } from "@baro/db";
import { serve } from "@hono/node-server";
import { app } from "./app";

const port = Number(process.env.PORT ?? 8000);

await runMigrations(getDb());

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`baro api listening on http://localhost:${info.port}`);
});
