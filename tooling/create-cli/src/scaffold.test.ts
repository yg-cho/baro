import { describe, expect, it } from "vitest";
import {
  generateEnvFiles,
  renameRootPackage,
  SANITIZE_PATHS,
  validateProjectName,
} from "./scaffold";

describe("validateProjectName", () => {
  it("accepts kebab-case names", () => {
    expect(validateProjectName("my-app")).toBeUndefined();
    expect(validateProjectName("app2")).toBeUndefined();
  });
  it("rejects invalid names", () => {
    expect(validateProjectName("")).toBeTruthy();
    expect(validateProjectName("My App")).toBeTruthy();
    expect(validateProjectName("UPPER")).toBeTruthy();
    expect(validateProjectName(".hidden")).toBeTruthy();
  });
});

describe("generateEnvFiles", () => {
  it("creates api env with a strong random secret", () => {
    const files = generateEnvFiles({});
    const api = files.find((f) => f.path === "apps/api/.env");
    expect(api).toBeDefined();
    const secret = api?.content.match(/BETTER_AUTH_SECRET=(.+)/)?.[1] ?? "";
    expect(secret.length).toBeGreaterThanOrEqual(32);
    expect(api?.content).not.toContain("DATABASE_URL=");
  });

  it("two runs produce different secrets", () => {
    const a = generateEnvFiles({});
    const b = generateEnvFiles({});
    expect(a[0].content).not.toBe(b[0].content);
  });

  it("includes DATABASE_URL when postgres chosen", () => {
    const files = generateEnvFiles({
      databaseUrl: "postgres://u:p@localhost:5432/db",
    });
    const api = files.find((f) => f.path === "apps/api/.env");
    expect(api?.content).toContain(
      "DATABASE_URL=postgres://u:p@localhost:5432/db",
    );
  });

  it("creates web env pointing at the api", () => {
    const files = generateEnvFiles({});
    const web = files.find((f) => f.path === "apps/web/.env.local");
    expect(web?.content).toContain("NEXT_PUBLIC_API_URL=http://localhost:8000");
  });
});

describe("SANITIZE_PATHS", () => {
  it("removes internal-only paths", () => {
    for (const p of [
      ".git",
      "docs/superpowers",
      ".superpowers",
      "tooling",
      ".claude",
      ".agents",
      ".windsurf",
    ]) {
      expect(SANITIZE_PATHS).toContain(p);
    }
  });
});

describe("renameRootPackage", () => {
  it("replaces only the root name", () => {
    const input = JSON.stringify({ name: "baro", private: true }, null, 2);
    const out = JSON.parse(renameRootPackage(input, "my-app"));
    expect(out.name).toBe("my-app");
    expect(out.private).toBe(true);
  });
});
