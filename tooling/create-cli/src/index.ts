#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import * as p from "@clack/prompts";
import { downloadTemplate } from "giget";
import {
  generateEnvFiles,
  renameRootPackage,
  SANITIZE_PATHS,
  validateProjectName,
} from "./scaffold";

const TEMPLATE = "github:yg-cho/baro#main";

async function main() {
  p.intro("create-baro — fullstack app, right away");

  const name = await p.text({
    message: "Project name",
    placeholder: "my-baro-app",
    validate: validateProjectName,
  });
  if (p.isCancel(name)) return cancel();

  const db = await p.select({
    message: "Database",
    options: [
      {
        value: "pglite",
        label: "Embedded (PGlite)",
        hint: "zero setup, start now — switch to Postgres later",
      },
      { value: "postgres", label: "Postgres", hint: "I have a DATABASE_URL" },
    ],
  });
  if (p.isCancel(db)) return cancel();

  let databaseUrl: string | undefined;
  if (db === "postgres") {
    const url = await p.text({
      message: "Postgres connection string",
      placeholder: "postgres://user:pass@localhost:5432/mydb",
      validate: (v) =>
        v.startsWith("postgres") ? undefined : "Must be a postgres:// URL",
    });
    if (p.isCancel(url)) return cancel();
    databaseUrl = url;
  }

  const dir = resolve(process.cwd(), name);
  if (existsSync(dir)) {
    p.cancel(`Directory ${name} already exists`);
    process.exit(1);
  }

  const s = p.spinner();

  s.start("Downloading template");
  const localTemplate = process.env.CREATE_BARO_TEMPLATE_DIR;
  if (localTemplate) {
    await mkdir(dir, { recursive: true });
    await cp(localTemplate, dir, { recursive: true });
  } else {
    await downloadTemplate(TEMPLATE, { dir });
  }
  s.stop("Template ready");

  s.start("Tidying up");
  for (const path of SANITIZE_PATHS) {
    await rm(join(dir, path), { recursive: true, force: true });
  }
  const rootPkgPath = join(dir, "package.json");
  await writeFile(
    rootPkgPath,
    renameRootPackage(await readFile(rootPkgPath, "utf8"), name),
  );
  for (const file of generateEnvFiles({ databaseUrl })) {
    await writeFile(join(dir, file.path), file.content);
  }
  s.stop("Project configured");

  const skipInstall = process.argv.includes("--skip-install");
  if (!skipInstall) {
    s.start("Installing dependencies (this is the slow part)");
    const res = spawnSync("pnpm", ["install"], { cwd: dir, stdio: "pipe" });
    if (res.status !== 0) {
      s.stop("Install failed — run `pnpm install` manually");
    } else {
      s.stop("Dependencies installed");
    }
  }

  spawnSync("git", ["init", "-b", "main"], { cwd: dir, stdio: "ignore" });
  spawnSync("git", ["add", "-A"], { cwd: dir, stdio: "ignore" });
  spawnSync("git", ["commit", "-m", "chore: scaffold with create-baro"], {
    cwd: dir,
    stdio: "ignore",
  });

  p.note(
    [
      `cd ${name}`,
      skipInstall ? "pnpm install" : null,
      "pnpm dev            # web :3000 + api :8000",
      "pnpm seed:admin you@example.com yourpassword   # first admin",
    ]
      .filter(Boolean)
      .join("\n"),
    "Next steps",
  );
  p.outro("Done. It just runs.");
}

function cancel() {
  p.cancel("Cancelled");
  process.exit(1);
}

main();
