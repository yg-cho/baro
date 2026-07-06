import { sep } from "node:path";
import { describe, expect, it } from "vitest";
import {
  generateEnvFiles,
  isArtifactPath,
  parseArgs,
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
      "apps/web/CLAUDE.md",
      "apps/web/AGENTS.md",
    ]) {
      expect(SANITIZE_PATHS).toContain(p);
    }
  });

  it("includes top-level build/dep artifacts", () => {
    for (const p of [
      "node_modules",
      ".turbo",
      "dist",
      "coverage",
      ".next",
      ".baro",
      "playwright-report",
      "test-results",
    ]) {
      expect(SANITIZE_PATHS).toContain(p);
    }
  });
});

describe("isArtifactPath", () => {
  it("flags top-level artifact dirs", () => {
    expect(isArtifactPath(["repo", "node_modules"].join(sep))).toBe(true);
    expect(isArtifactPath(["repo", "dist"].join(sep))).toBe(true);
  });

  it("flags nested artifact dirs", () => {
    expect(isArtifactPath(["repo", "apps", "web", ".next"].join(sep))).toBe(
      true,
    );
    expect(
      isArtifactPath(["repo", "packages", "db", "node_modules"].join(sep)),
    ).toBe(true);
  });

  it("does not flag normal source paths", () => {
    expect(isArtifactPath(["repo", "apps", "web", "src"].join(sep))).toBe(
      false,
    );
    expect(isArtifactPath(["repo", "package.json"].join(sep))).toBe(false);
  });
});

describe("parseArgs", () => {
  it("parses --name, --db, --database-url", () => {
    const args = parseArgs([
      "--name",
      "my-app",
      "--db",
      "postgres",
      "--database-url",
      "postgres://u:p@localhost:5432/db",
    ]);
    expect(args.name).toBe("my-app");
    expect(args.db).toBe("postgres");
    expect(args.databaseUrl).toBe("postgres://u:p@localhost:5432/db");
    expect(args.skipInstall).toBe(false);
  });

  it("parses --skip-install and defaults", () => {
    const args = parseArgs(["--skip-install"]);
    expect(args.skipInstall).toBe(true);
    expect(args.name).toBeUndefined();
    expect(args.db).toBeUndefined();
  });

  it("ignores an invalid --db value", () => {
    const args = parseArgs(["--db", "sqlite"]);
    expect(args.db).toBeUndefined();
  });

  it("returns empty args for no flags", () => {
    const args = parseArgs([]);
    expect(args).toEqual({ skipInstall: false });
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
