import { describe, expect, it } from "vitest";
import { createDb, runMigrations } from "./index";
import { user } from "./schema";

describe("db", () => {
  it("migrates and inserts a user on in-memory pglite", async () => {
    const db = createDb({ dataDir: "memory://" });
    await runMigrations(db);

    await db.insert(user).values({
      id: "u1",
      name: "Test",
      email: "t@example.com",
    });

    const rows = await db.select().from(user);
    expect(rows).toHaveLength(1);
    expect(rows[0].email).toBe("t@example.com");
    expect(rows[0].role).toBe("user");
  });
});
