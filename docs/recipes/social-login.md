# Adding social login

Google and GitHub sign-in are already wired into `packages/auth/src/index.ts`
— `enabledSocialProviders()` turns each provider on the moment its client
ID/secret env vars are present, and the login buttons appear automatically.
There's no code to write, just OAuth apps to create and env vars to set.

Better Auth is mounted at `basePath: "/api/auth"`, so every provider's
callback URL is `${BETTER_AUTH_URL}/api/auth/callback/<provider>` — e.g.
`http://localhost:8000/api/auth/callback/google` in dev.

## Steps

### Google

1. Go to the [Google Cloud Console credentials page](https://console.cloud.google.com/apis/credentials),
   create (or pick) a project, and create an **OAuth client ID** of type
   "Web application".
2. Add an **Authorized redirect URI**:
   `${BETTER_AUTH_URL}/api/auth/callback/google` (e.g.
   `http://localhost:8000/api/auth/callback/google` for local dev).
3. Copy the client ID and secret into `apps/api/.env`:
   ```
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   ```

### GitHub

1. Go to [GitHub Developer Settings → OAuth Apps](https://github.com/settings/developers)
   and create a **New OAuth App**.
2. Set **Authorization callback URL** to
   `${BETTER_AUTH_URL}/api/auth/callback/github`.
3. Copy the client ID and generate a client secret into `apps/api/.env`:
   ```
   GITHUB_CLIENT_ID=...
   GITHUB_CLIENT_SECRET=...
   ```

### Either way

4. Restart the api. `enabledSocialProviders()` checks these env vars at
   `createAuth()` time, so a restart is enough — no schema or route changes.

## Verify it worked

- The web login page shows a "Continue with Google" / "Continue with GitHub"
  button once the corresponding env vars are set.
- Clicking it redirects to the provider, then back to your app, logged in.
- If you get a redirect_uri_mismatch error from the provider, double-check
  the callback URL matches `${BETTER_AUTH_URL}/api/auth/callback/<provider>`
  exactly (including http vs https and the port).
