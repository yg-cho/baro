import { createDb, runMigrations } from "@baro/db";
import { beforeAll, describe, expect, it } from "vitest";
import { createAuth } from "./index";

describe("auth", () => {
  let auth: ReturnType<typeof createAuth>;

  beforeAll(async () => {
    const db = createDb({ dataDir: "memory://" });
    await runMigrations(db);
    auth = createAuth(db);
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
});
