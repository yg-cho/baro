import { createDb, type Db, runMigrations } from "@baro/db";
import { beforeAll, describe, expect, it } from "vitest";
import { createAuth } from "./index";

describe("auth", () => {
  let auth: ReturnType<typeof createAuth>;
  let testDb: Db;

  beforeAll(async () => {
    testDb = createDb({ dataDir: "memory://" });
    await runMigrations(testDb);
    auth = createAuth(testDb);
  });

  it("signs up a user with email/password", async () => {
    const res = await auth.api.signUpEmail({
      body: {
        name: "Test User",
        email: "signup@example.com",
        password: "password1234",
      },
    });
    expect(res.user.email).toBe("signup@example.com");
  });

  it("signs in and returns a session", async () => {
    await auth.api.signUpEmail({
      body: {
        name: "Test User 2",
        email: "signin@example.com",
        password: "password1234",
      },
    });
    const res = await auth.api.signInEmail({
      body: { email: "signin@example.com", password: "password1234" },
      asResponse: true,
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).toContain("better-auth");
  });

  it("throws in production when BETTER_AUTH_SECRET is unset", async () => {
    const db = createDb({ dataDir: "memory://" });
    await runMigrations(db);
    const prevNodeEnv = process.env.NODE_ENV;
    const prevSecret = process.env.BETTER_AUTH_SECRET;
    process.env.NODE_ENV = "production";
    delete process.env.BETTER_AUTH_SECRET;
    try {
      expect(() => createAuth(db)).toThrow(/BETTER_AUTH_SECRET/);
    } finally {
      process.env.NODE_ENV = prevNodeEnv;
      process.env.BETTER_AUTH_SECRET = prevSecret;
    }
  });

  it("admin can list users via admin plugin", async () => {
    await auth.api.signUpEmail({
      body: {
        name: "Admin",
        email: "admin@example.com",
        password: "password1234",
      },
    });
    // 직접 role 승격 (seed 스크립트와 동일 방식)
    const { eq } = await import("drizzle-orm");
    const { schema } = await import("@baro/db");
    await testDb
      .update(schema.user)
      .set({ role: "admin" })
      .where(eq(schema.user.email, "admin@example.com"));

    const signIn = await auth.api.signInEmail({
      body: { email: "admin@example.com", password: "password1234" },
      asResponse: true,
    });
    const cookie = signIn.headers.get("set-cookie") ?? "";

    const users = await auth.api.listUsers({
      query: { limit: 100 },
      headers: new Headers({ cookie }),
    });
    expect(users.users.length).toBeGreaterThanOrEqual(1);
  });

  it("non-admin cannot list users", async () => {
    await auth.api.signUpEmail({
      body: {
        name: "Pleb",
        email: "pleb@example.com",
        password: "password1234",
      },
    });
    const signIn = await auth.api.signInEmail({
      body: { email: "pleb@example.com", password: "password1234" },
      asResponse: true,
    });
    const cookie = signIn.headers.get("set-cookie") ?? "";

    await expect(
      auth.api.listUsers({
        query: { limit: 100 },
        headers: new Headers({ cookie }),
      }),
    ).rejects.toThrow();
  });
});
