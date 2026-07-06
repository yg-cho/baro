import { createMiddleware } from "hono/factory";
import { auth } from "./routes";

type SessionUser = NonNullable<
  Awaited<ReturnType<typeof auth.api.getSession>>
>["user"];

export type AuthEnv = {
  Variables: {
    sessionUser: SessionUser;
  };
};

export const requireAuth = createMiddleware<AuthEnv>(async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    return c.json(
      { error: { code: "UNAUTHORIZED", message: "Sign in required" } },
      401,
    );
  }
  c.set("sessionUser", session.user);
  await next();
});
