import { test, expect, loginThroughUi } from "./fixtures/test";

test("registers an isolated backend user and signs in through the UI", async ({ page, user }) => {
  await loginThroughUi(page, user);
  await expect(page.getByRole("heading", { name: "Próximas transações" })).toBeVisible();
});
