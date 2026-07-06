import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { adminRoutes } from "./modules/admin/routes";
import { authRoutes } from "./modules/auth/routes";
import { healthRoutes } from "./modules/health/routes";

// Order matters: .doc() must come before .use()/.route() and .route() must stay
// chained last so AppType keeps full route typing for the web RPC client.
// Side effect: /openapi.json intentionally gets no CORS. Do not "fix" the order.
export const app = new OpenAPIHono()
  .doc("/openapi.json", {
    openapi: "3.1.0",
    info: { title: "baro API", version: "0.0.0" },
  })
  .use(
    cors({
      origin: process.env.WEB_ORIGIN
        ? [process.env.WEB_ORIGIN]
        : ["http://localhost:3000", "http://127.0.0.1:3000"],
      credentials: true,
    }),
  )
  .route("/health", healthRoutes)
  .route("/api/auth", authRoutes)
  .route("/api/admin", adminRoutes);

export type AppType = typeof app;
