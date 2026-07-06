import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { healthResponseSchema } from "@baro/shared/schemas/health";

export const healthRoutes = new OpenAPIHono().openapi(
  createRoute({
    method: "get",
    path: "/",
    responses: {
      200: {
        description: "Service health",
        content: {
          "application/json": { schema: healthResponseSchema },
        },
      },
    },
  }),
  (c) => c.json({ status: "ok" as const }, 200),
);
