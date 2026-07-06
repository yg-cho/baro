import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { migrate as migrateNodePg } from "drizzle-orm/node-postgres/migrator";
import { PgliteDatabase } from "drizzle-orm/pglite";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import type { Db } from "./client";

const migrationsFolder = join(
  dirname(fileURLToPath(import.meta.url)),
  "../drizzle",
);

export async function runMigrations(db: Db): Promise<void> {
  // drizzle instance driver detection: PgliteDatabase is the class drizzle-orm/pglite's
  // `drizzle()` returns, cleaner than sniffing `$client.constructor.name`.
  if (db instanceof PgliteDatabase) {
    await migratePglite(db as Parameters<typeof migratePglite>[0], {
      migrationsFolder,
    });
  } else {
    await migrateNodePg(db as Parameters<typeof migrateNodePg>[0], {
      migrationsFolder,
    });
  }
}
