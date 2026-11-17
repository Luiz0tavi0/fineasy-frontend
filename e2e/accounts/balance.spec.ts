import { test, expect, loginThroughUi } from "../fixtures/test";
import { createAccount, getAccount } from "../helpers/accounts";
import { localToday } from "../helpers/dates";
import { listTransactions, getTransaction } from "../helpers/transactions";
import { brlText } from "../helpers/money";

test("planned expense completion, paid edit, and cancellation update balances", async ({ api, page, user }) => {
  // Arrange
  const account = await createAccount(api, user, {
    name: "Lifecycle account",
    account_type: "BANK",
    initial_balance: "1000.00",
  });
  const description = "Balance lifecycle expense";
  await loginThroughUi(page, user);

  // Act
  await page.goto("/transactions/new");
  await page.getByRole("combobox", { name: "Conta", exact: true }).selectOption(String(account.id));
  await page.getByLabel("Descrição").fill(description);
  await page.getByRole("textbox", { name: "Valor previsto", exact: true }).fill("300.00");
  await page.getByLabel("Vencimento").fill(localToday());
  await page.getByRole("button", { name: "Criar transação" }).click();
  await expect(page).toHaveURL(/\/transactions$/);

  // Assert
  const [planned] = (await listTransactions(api, user)).filter((item) => item.description === description);
  expect(planned).toBeDefined();
  expect(planned?.status).toBe("PENDING");
  await page.goto("/");
  await expect(page.getByText("Saldo atual", { exact: true }).locator("..")).toContainText(brlText("1.000,00"));
  await expect(page.getByText("Saldo projetado", { exact: true }).locator("..")).toContainText(brlText("700,00"));

  // Act
  await page.getByRole("button", { name: "Concluir", exact: true }).click();
  const completionDialog = page.getByRole("dialog");
  await completionDialog.getByLabel("Valor realizado").fill("280.00");
  await completionDialog.getByRole("button", { name: "Concluir", exact: true }).click();

  // Assert
  await expect(page.getByText("Saldo atual", { exact: true }).locator("..")).toContainText(brlText("720,00"));
  expect((await getTransaction(api, user, planned!.id)).status).toBe("COMPLETED");
  expect((await getAccount(api, user, account.id)).current_balance).toBe("720.00");

  // Act
  await page.goto("/transactions");
  const row = page.getByRole("row").filter({ has: page.getByText(description, { exact: true }) });
  await row.getByRole("button", { name: "Editar" }).click();
  const editDialog = page.getByRole("dialog");
  await editDialog.getByLabel("Valor realizado").fill("300.00");
  await expect(editDialog.getByText("Impacto previsto")).toBeVisible();
  await editDialog.getByRole("button", { name: "Salvar" }).click();
  await expect(editDialog).toBeHidden();

  // Assert
  expect((await getAccount(api, user, account.id)).current_balance).toBe("700.00");
  await page.goto("/");
  await expect(page.getByText("Saldo atual", { exact: true }).locator("..")).toContainText(brlText("700,00"));

  // Act
  await page.goto("/transactions");
  const updatedRow = page.getByRole("row").filter({ has: page.getByText(description, { exact: true }) });
  await updatedRow.getByRole("button", { name: "Cancelar" }).click();
  const confirmDialog = page.getByRole("alertdialog");
  await expect(confirmDialog).toContainText("A transação será mantida no histórico");
  await confirmDialog.getByRole("button", { name: "Cancelar transação" }).click();
  await expect(confirmDialog).toBeHidden();

  // Assert
  expect((await getTransaction(api, user, planned!.id)).status).toBe("CANCELLED");
  expect((await getAccount(api, user, account.id)).current_balance).toBe("1000.00");
  await page.goto("/");
  await expect(page.getByText("Saldo atual", { exact: true }).locator("..")).toContainText(brlText("1.000,00"));
});
