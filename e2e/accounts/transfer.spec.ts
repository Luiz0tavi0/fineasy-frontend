import { test, expect, loginThroughUi } from "../fixtures/test";
import { createAccount, getAccount } from "../helpers/accounts";
import { localToday } from "../helpers/dates";
import { cents } from "../helpers/money";
import { listTransactions } from "../helpers/transactions";
import { listTransfers } from "../helpers/transfers";

test("transfers preserve combined balance without creating ordinary transactions", async ({ api, page, user }) => {
  // Arrange
  const source = await createAccount(api, user, {
    name: "Transfer source",
    account_type: "BANK",
    initial_balance: "1000.00",
  });
  const destination = await createAccount(api, user, {
    name: "Transfer destination",
    account_type: "WALLET",
    initial_balance: "0.00",
  });
  const description = "Internal account transfer";
  await loginThroughUi(page, user);

  // Act
  await page.goto("/transfers");
  await page.getByRole("button", { name: "Nova transferência" }).first().click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Conta de origem").selectOption(String(source.id));
  await dialog.getByLabel("Conta de destino").selectOption(String(destination.id));
  await dialog.getByLabel("Valor").fill("250.00");
  await dialog.getByLabel("Descrição (opcional)").fill(description);
  await dialog.getByLabel("Data").fill(localToday());
  await dialog.getByRole("button", { name: "Criar transferência" }).click();

  // Assert
  await expect(page.getByRole("row").filter({ hasText: description })).toBeVisible();
  const [transfer] = (await listTransfers(api, user)).filter((item) => item.description === description);
  expect(transfer).toBeDefined();
  expect((await getAccount(api, user, source.id)).current_balance).toBe("750.00");
  expect((await getAccount(api, user, destination.id)).current_balance).toBe("250.00");
  expect(cents((await getAccount(api, user, source.id)).current_balance)
    + cents((await getAccount(api, user, destination.id)).current_balance)).toBe(100_000);
  expect(await listTransactions(api, user)).toEqual([]);

  await page.goto("/accounts");
  await expect(page.getByRole("row").filter({ hasText: "Transfer source" })).toContainText(/R\$\s*750,00/);
  await expect(page.getByRole("row").filter({ hasText: "Transfer destination" })).toContainText(/R\$\s*250,00/);
});
