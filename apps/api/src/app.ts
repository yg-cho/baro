import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { healthRoutes } from "./modules/health/routes";

// Order matters: .doc() must come before .use()/.route() and .route() must stay
// chained last so AppType keeps full route typing for the web RPC client.
// Side effect: /openapi.json intentionally gets no CORS. Do not "fix" the order.
export const app = new OpenAPIHono()
  .doc("/openapi.json", {
    openapi: "3.1.0",
    info: { title: "baro API", version: "0.0.0" },
  })
  .use(cors({ origin: process.env.WEB_ORIGIN ?? "http://localhost:3000" }))
  .route("/health", healthRoutes);

export type AppType = typeof app;
