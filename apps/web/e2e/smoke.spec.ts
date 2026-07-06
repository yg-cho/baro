import { expect, test } from "@playwright/test";

const PW = "password1234";
// ports defined in playwright.config.ts webServer
const API = "http://127.0.0.1:8100";

test("signup auto-logs-in and shows the user email", async ({ page }) => {
  const email = `smoke-${Date.now()}@e2e.test`;
  await page.goto("/signup");
  await page.getByLabel("Name").fill("Smoke");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PW);
  await page.getByRole("button", { name: "Sign up" }).click();
  await expect(page.getByText(email)).toBeVisible({ timeout: 15_000 });
});

test("admin can open the dashboard", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@e2e.test");
  await page.getByLabel("Password").fill(PW);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("admin@e2e.test")).toBeVisible({
    timeout: 15_000,
  });
  await page.goto("/admin");
  await expect(page.getByText("Total users")).toBeVisible({
    timeout: 15_000,
  });
});

test("banned user cannot sign in", async ({ page, request }) => {
  const email = `banned-${Date.now()}@e2e.test`;
  // 가입
  await request.post(`${API}/api/auth/sign-up/email`, {
    data: { name: "Banned", email, password: PW },
    headers: { origin: "http://127.0.0.1:3100" },
  });
  // admin으로 정지
  const adminCtx = await request.post(`${API}/api/auth/sign-in/email`, {
    data: { email: "admin@e2e.test", password: PW },
    headers: { origin: "http://127.0.0.1:3100" },
  });
  const cookie = adminCtx.headers()["set-cookie"] ?? "";
  const users = await request.get(
    `${API}/api/auth/admin/list-users?searchField=email&searchOperator=contains&searchValue=${email}`,
    { headers: { cookie, origin: "http://127.0.0.1:3100" } },
  );
  const userId = (await users.json()).users[0].id;
  await request.post(`${API}/api/auth/admin/ban-user`, {
    data: { userId },
    headers: { cookie, origin: "http://127.0.0.1:3100" },
  });
  // UI에서 로그인 시도 → 에러 표시
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PW);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("alert")).toBeVisible({
    timeout: 15_000,
  });
});

test("todos round trip", async ({ page }) => {
  const email = `todos-${Date.now()}@e2e.test`;
  await page.goto("/signup");
  await page.getByLabel("Name").fill("Todoer");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PW);
  await page.getByRole("button", { name: "Sign up" }).click();
  await expect(page.getByText(email)).toBeVisible({ timeout: 15_000 });

  await page.goto("/todos");
  await page.getByLabel("New todo title").fill("ship plan 4");
  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.getByText("ship plan 4")).toBeVisible();

  // ponytail: the checkbox is server-controlled (toggle mutation round-trips
  // then invalidates), so its `checked` attribute doesn't flip synchronously
  // on click — .check() asserts that and fails immediately. .click() + the
  // polling assertion below waits out the round-trip instead.
  await page.getByLabel("Toggle ship plan 4").click();
  await expect(page.getByText("ship plan 4")).toHaveClass(/line-through/);

  await page.getByRole("button", { name: "Delete ship plan 4" }).click();
  await expect(page.getByText("Nothing yet.")).toBeVisible();
});
