import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzleNodePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { Pool } from "pg";
import * as schema from "./schema";

export type CreateDbOptions = {
  /** Postgres connection string. Falls back to DATABASE_URL. */
  url?: string;
  /** PGlite data directory. "memory://" for in-memory. Default ".baro/pglite". */
  dataDir?: string;
};

export function createDb(options: CreateDbOptions = {}) {
  const url = options.url ?? process.env.DATABASE_URL;
  if (url) {
    const pool = new Pool({ connectionString: url });
    return drizzleNodePg(pool, { schema });
  }
  const client = new PGlite(
    options.dataDir ?? process.env.PGLITE_DATA_DIR ?? ".baro/pglite",
  );
  return drizzlePglite(client, { schema });
}

export type Db = ReturnType<typeof createDb>;
