import { test as base, expect, type Page } from "@playwright/test";
import { TestApi } from "../helpers/api";
import { createTestUser, type TestUser } from "../helpers/users";

type TestFixtures = Readonly<{
  api: TestApi;
  user: TestUser;
}>;

export const test = base.extend<TestFixtures>({
  api: async ({ request }, use) => {
    await use(new TestApi(request));
  },
  user: async ({ api }, use) => {
    const user = await createTestUser(api);
    await use(user);
  },
});

export { expect };

export async function loginThroughUi(page: Page, user: TestUser): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(user.email);
  await page.getByLabel("Senha").fill(user.password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("link", { name: "Transações" })).toBeVisible();
}
