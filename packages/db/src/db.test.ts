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

  it("inserts and lists todos scoped to a user", async () => {
    const db = createDb({ dataDir: "memory://" });
    await runMigrations(db);

    await db
      .insert(user)
      .values({ id: "u2", name: "T", email: "todo@example.com" });
    const { todo } = await import("./schema");
    await db.insert(todo).values({
      id: "t1",
      userId: "u2",
      title: "write example feature",
    });

    const rows = await db.select().from(todo);
    expect(rows).toHaveLength(1);
    expect(rows[0].completed).toBe(false);
    expect(rows[0].userId).toBe("u2");
  });
});
