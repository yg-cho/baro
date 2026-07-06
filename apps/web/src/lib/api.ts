import { hc } from "hono/client";
import type { AppType } from "@baro/api/client";

export const api = hc<AppType>(
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
);
