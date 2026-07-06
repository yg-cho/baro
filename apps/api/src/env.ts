// Load apps/api/.env if present (create-baro writes one; the repo itself has none).
// Node's loadEnvFile: real environment variables take precedence over file values.
try {
  process.loadEnvFile(".env");
} catch {
  // no .env — env comes from the shell (tests, CI, production)
}
