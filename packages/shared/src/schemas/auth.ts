import { z } from "zod";

export const authProvidersSchema = z.object({
  email: z.literal(true),
  google: z.boolean(),
  github: z.boolean(),
});

export type AuthProviders = z.infer<typeof authProvidersSchema>;
