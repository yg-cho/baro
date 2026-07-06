import { describe, expect, it } from "vitest";
import { app } from "../../app";

async function signUpAndGetCookie(email: string): Promise<string> {
  const res = await app.request("/api/auth/sign-up/email", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "T", email, password: "password1234" }),
  });
  return res.headers.get("set-cookie") ?? "";
}

describe("GET /api/admin/stats", () => {
  it("401 without a session", async () => {
    const res = await app.request("/api/admin/stats");
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("403 for a non-admin user", async () => {
    const cookie = await signUpAndGetCookie("stats-pleb@example.com");
    const res = await app.request("/api/admin/stats", {
      headers: { cookie },
    });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("200 with counts for an admin", async () => {
    const cookie = await signUpAndGetCookie("stats-admin@example.com");
    const { getDb, schema } = await import("@baro/db");
    const { eq } = await import("drizzle-orm");
    await getDb()
      .update(schema.user)
      .set({ role: "admin" })
      .where(eq(schema.user.email, "stats-admin@example.com"));

    const res = await app.request("/api/admin/stats", {
      headers: { cookie },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.totalUsers).toBeGreaterThanOrEqual(2);
    expect(typeof body.totalUsers).toBe("number");
    expect(Array.isArray(body.signupsByDay)).toBe(true);
    expect(body.signupsByDay.length).toBeGreaterThanOrEqual(1);
    expect(body.signupsByDay[0]).toHaveProperty("day");
    expect(body.signupsByDay[0]).toHaveProperty("count");
  });
});
