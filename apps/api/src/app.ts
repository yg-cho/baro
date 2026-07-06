import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { healthRoutes } from "./modules/health/routes";

export const app = new OpenAPIHono()
  .doc("/openapi.json", {
    openapi: "3.1.0",
    info: { title: "baro API", version: "0.0.0" },
  })
  .use(
    cors({ origin: process.env.WEB_ORIGIN ?? "http://localhost:3000" }),
  )
  .route("/health", healthRoutes);

export type AppType = typeof app;
