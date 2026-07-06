export { type CreateDbOptions, createDb, type Db } from "./client";
export { runMigrations } from "./migrate";
export * as schema from "./schema";

import type { Db } from "./client";
import { createDb } from "./client";

let _db: Db | undefined;
/** Lazy singleton — env-based. Tests should create their own via createDb(). */
export function getDb(): Db {
  _db ??= createDb();
  return _db;
}
