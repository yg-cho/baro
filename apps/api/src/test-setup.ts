import { getDb, runMigrations } from "@baro/db";

await runMigrations(getDb());
