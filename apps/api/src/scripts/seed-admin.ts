import "../env";
import { createAuth } from "@baro/auth";
import { getDb, runMigrations, schema } from "@baro/db";
import { eq } from "drizzle-orm";

const email = (process.env.ADMIN_EMAIL ?? process.argv[2])?.toLowerCase();
const password = process.env.ADMIN_PASSWORD ?? process.argv[3];

if (!email || !password) {
  console.error("usage: pnpm seed:admin <email> <password>");
  process.exit(1);
}

const db = getDb();
await runMigrations(db);
const auth = createAuth(db);

const existing = await db
  .select()
  .from(schema.user)
  .where(eq(schema.user.email, email));

if (existing.length === 0) {
  await auth.api.signUpEmail({
    body: { name: "Admin", email, password },
  });
}

// ponytail: no field-selector arg to .returning() — Db is a union of two
// drizzle drivers (pg / pglite) and the union only resolves the 0-arg
// overload; full-row returning avoids that generic-overload mismatch.
const updated = await db
  .update(schema.user)
  .set({ role: "admin" })
  .where(eq(schema.user.email, email))
  .returning();

if (updated.length === 0) {
  console.error(`[baro] failed to promote ${email} — user row not found`);
  process.exit(1);
}

console.log(`[baro] admin ready: ${email}`);
process.exit(0);
