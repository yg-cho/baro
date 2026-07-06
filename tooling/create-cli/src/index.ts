#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import * as p from "@clack/prompts";
import { downloadTemplate } from "giget";
import {
  generateEnvFiles,
  isArtifactPath,
  parseArgs,
  renameRootPackage,
  SANITIZE_PATHS,
  validateProjectName,
} from "./scaffold";

const TEMPLATE = "github:yg-cho/baro#main";

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.name) {
    const nameError = validateProjectName(args.name);
    if (nameError) {
      console.error(`Error: ${nameError}`);
      process.exit(1);
    }
    let databaseUrl: string | undefined;
    if (args.db === "postgres") {
      if (!args.databaseUrl?.startsWith("postgres")) {
        console.error(
          "Error: --database-url must be a postgres:// URL when --db postgres",
        );
        process.exit(1);
      }
      databaseUrl = args.databaseUrl;
    }
    const dir = resolve(process.cwd(), args.name);
    if (existsSync(dir)) {
      console.error(`Error: Directory ${args.name} already exists`);
      process.exit(1);
    }
    await scaffold({
      name: args.name,
      dir,
      databaseUrl,
      skipInstall: args.skipInstall,
    });
    return;
  }

  p.intro("create-baro — fullstack app, right away");

  const name = await p.text({
    message: "Project name",
    placeholder: "my-baro-app",
    validate: validateProjectName,
  });
  if (p.isCancel(name)) return cancel();

  const dir = resolve(process.cwd(), name);
  if (existsSync(dir)) {
    p.cancel(`Directory ${name} already exists`);
    process.exit(1);
  }

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

  await scaffold({ name, dir, databaseUrl, skipInstall: args.skipInstall });
}

async function scaffold(opts: {
  name: string;
  dir: string;
  databaseUrl?: string;
  skipInstall: boolean;
}) {
  const { name, dir, databaseUrl, skipInstall } = opts;
  const s = p.spinner();

  s.start("Downloading template");
  const localTemplate = process.env.CREATE_BARO_TEMPLATE_DIR;
  if (localTemplate) {
    await mkdir(dir, { recursive: true });
    await cp(localTemplate, dir, {
      recursive: true,
      filter: (src) => !isArtifactPath(src),
    });
  } else {
    try {
      await downloadTemplate(TEMPLATE, { dir });
    } catch {
      p.cancel("Template download failed — check network/repo");
      process.exit(1);
    }
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

  if (!skipInstall) {
    s.start("Installing dependencies (this is the slow part)");
    const res = spawnSync("pnpm", ["install"], { cwd: dir, stdio: "pipe" });
    if (res.status !== 0) {
      const errorCode = (res.error as NodeJS.ErrnoException | undefined)?.code;
      if (errorCode === "ENOENT" || res.status === null) {
        s.stop(
          "pnpm is required (the generated project is a pnpm workspace): npm i -g pnpm — then run pnpm install in the project",
        );
      } else {
        s.stop("Install failed — run `pnpm install` manually");
      }
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
