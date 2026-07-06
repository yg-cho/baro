import { z } from "zod";

export const adminStatsSchema = z.object({
  totalUsers: z.number(),
  signupsByDay: z.array(
    z.object({
      day: z.string(), // YYYY-MM-DD
      count: z.number(),
    }),
  ),
});

export type AdminStats = z.infer<typeof adminStatsSchema>;
