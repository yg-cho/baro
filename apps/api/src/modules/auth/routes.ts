import { createAuth, enabledSocialProviders } from "@baro/auth";
import { getDb } from "@baro/db";
import { authProvidersSchema } from "@baro/shared/schemas/auth";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";

export const auth = createAuth(getDb());

export const authRoutes = new OpenAPIHono()
  .openapi(
    createRoute({
      method: "get",
      path: "/providers",
      responses: {
        200: {
          description: "Enabled auth providers",
          content: {
            "application/json": { schema: authProvidersSchema },
          },
        },
      },
    }),
    (c) => {
      const social = enabledSocialProviders();
      return c.json({ email: true as const, ...social }, 200);
    },
  )
  .on(["GET", "POST"], "/*", (c) => auth.handler(c.req.raw));
