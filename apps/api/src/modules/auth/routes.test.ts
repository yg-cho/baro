import { describe, expect, it } from "vitest";
import { app } from "../../app";

describe("auth module", () => {
  it("GET /api/auth/providers returns provider flags", async () => {
    const res = await app.request("/api/auth/providers");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.email).toBe(true);
    expect(typeof body.google).toBe("boolean");
  });

  it("signs up via HTTP and gets a session cookie", async () => {
    const res = await app.request("/api/auth/sign-up/email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "HTTP User",
        email: "http@example.com",
        password: "password1234",
      }),
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).toContain("better-auth");
  });

  it("returns the session for a signed-in user", async () => {
    const signUp = await app.request("/api/auth/sign-up/email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Session User",
        email: "session@example.com",
        password: "password1234",
      }),
    });
    const cookie = signUp.headers.get("set-cookie") ?? "";
    const res = await app.request("/api/auth/get-session", {
      headers: { cookie },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user.email).toBe("session@example.com");
  });
});
