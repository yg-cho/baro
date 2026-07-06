# Wiring up real email

In dev, password resets and signup verification just log a link to the
console — see `sendResetPassword` and `sendVerificationEmail` in
`packages/auth/src/index.ts` (the latter fires on every signup, since
`emailVerification.sendOnSignUp: true`). For production you need those two
callbacks to actually send mail. This recipe swaps them for
[Resend](https://resend.com) — pick any provider, the shape is the same.

## Steps

1. Add the dependency (not installed by default — pick your provider):
   ```bash
   pnpm --filter @baro/auth add resend
   ```

2. In `packages/auth/src/index.ts`, replace the two `console.log` bodies:

   ```ts
   import { Resend } from "resend";

   const resend = new Resend(process.env.RESEND_API_KEY);

   // ...inside createAuth(db):
   emailAndPassword: {
     enabled: true,
     sendResetPassword: async ({ user, url }) => {
       await resend.emails.send({
         from: "baro <noreply@yourdomain.com>",
         to: user.email,
         subject: "Reset your password",
         html: `<a href="${url}">Reset password</a>`,
       });
     },
   },
   emailVerification: {
     sendOnSignUp: true,
     sendVerificationEmail: async ({ user, url }) => {
       await resend.emails.send({
         from: "baro <noreply@yourdomain.com>",
         to: user.email,
         subject: "Verify your email",
         html: `<a href="${url}">Verify email</a>`,
       });
     },
   },
   ```

3. Add `RESEND_API_KEY` to `apps/api/.env` (and to your production env,
   per [deploy.md](./deploy.md)).

4. Verify the sending domain with your provider (Resend requires a verified
   domain before it'll deliver to arbitrary recipients) and update the
   `from` address above to match.

## Verify it worked

- Sign up a new user — an email arrives with a working verification link,
  and the console no longer prints `[baro auth] verify email for ...`.
- Trigger a password reset — same check, for the reset email.
- Your provider's dashboard shows the send as delivered, not bounced.
