import type { Db } from "@baro/db";
import { schema } from "@baro/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

export function enabledSocialProviders() {
  return {
    google: Boolean(
      process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
    ),
    github: Boolean(
      process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET,
    ),
  };
}

export function createAuth(db: Db) {
  const social = enabledSocialProviders();

  if (
    process.env.NODE_ENV === "production" &&
    !process.env.BETTER_AUTH_SECRET
  ) {
    throw new Error("BETTER_AUTH_SECRET must be set in production");
  }

  return betterAuth({
    basePath: "/api/auth",
    secret: process.env.BETTER_AUTH_SECRET ?? "baro-dev-secret-change-me",
    baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:8000",
    trustedOrigins: process.env.WEB_ORIGIN
      ? [process.env.WEB_ORIGIN]
      : ["http://localhost:3000", "http://127.0.0.1:3000"],
    database: drizzleAdapter(db, { provider: "pg", schema }),
    emailAndPassword: {
      enabled: true,
      sendResetPassword: async ({ user, url }) => {
        // dev: console output. production: replace with SMTP (docs/recipes)
        console.log(`[baro auth] password reset for ${user.email}: ${url}`);
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      sendVerificationEmail: async ({ user, url }) => {
        console.log(`[baro auth] verify email for ${user.email}: ${url}`);
      },
    },
    socialProviders: {
      ...(social.google && {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID as string,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        },
      }),
      ...(social.github && {
        github: {
          clientId: process.env.GITHUB_CLIENT_ID as string,
          clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
        },
      }),
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
