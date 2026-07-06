import { createMiddleware } from "hono/factory";
import { auth } from "../auth/routes";

type SessionUser = NonNullable<
  Awaited<ReturnType<typeof auth.api.getSession>>
>["user"];

export type AdminEnv = {
  Variables: {
    adminUser: SessionUser;
  };
};

export const requireAdmin = createMiddleware<AdminEnv>(async (c, next) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });
  if (!session) {
    return c.json(
      { error: { code: "UNAUTHORIZED", message: "Sign in required" } },
      401,
    );
  }
  if (session.user.role !== "admin") {
    return c.json(
      { error: { code: "FORBIDDEN", message: "Admin access required" } },
      403,
    );
  }
  c.set("adminUser", session.user);
  await next();
});
