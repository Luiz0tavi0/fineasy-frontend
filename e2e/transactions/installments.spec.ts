import { test, expect, loginThroughUi } from "../fixtures/test";
import { randomUUID } from "node:crypto";
import { createAccount } from "../helpers/accounts";
import { createCategory } from "../helpers/categories";
import { firstOfNextMonth, localToday } from "../helpers/dates";
import { cents } from "../helpers/money";
import { listTransactions } from "../helpers/transactions";
import type { TestPurchase } from "../helpers/purchases";

test("purchase installment preview can change a date and persists exact amounts once", async ({ api, page, user }) => {
  // Arrange
  const account = await createAccount(api, user, {
    name: "Installment account",
    account_type: "BANK",
    initial_balance: "0.00",
  });
  const category = await createCategory(api, user, { name: `Installment category ${randomUUID()}`, direction: "EXPENSE" });
  const description = `Installment purchase ${randomUUID()}`;
  const changedDate = firstOfNextMonth(localToday());
  await loginThroughUi(page, user);

  // Act
  await page.goto("/purchases");
  await page.getByLabel("Descrição").fill(description);
  await page.getByLabel("Valor total").fill("100.00");
  await page.getByLabel("Data da compra").fill(localToday());
  await page.getByLabel("Número de parcelas").fill("3");
  await page.getByLabel("Conta (opcional)").selectOption(String(account.id));
  await page.getByLabel("Categoria (opcional)").selectOption(String(category.id));
  await page.getByRole("button", { name: "Simular parcelas" }).click();

  // Assert
  const preview = page.getByRole("heading", { name: "Prévia das parcelas" }).locator("..");
  await expect(preview.getByText(/Parcela 1.*R\$\s*33,34/)).toBeVisible();
  await expect(preview.getByText(/Parcela 2.*R\$\s*33,33/)).toBeVisible();
  await expect(preview.getByText(/Parcela 3.*R\$\s*33,33/)).toBeVisible();

  // Act
  await page.getByLabel("Data da parcela 2").fill(changedDate);
  const purchaseConfirmationResponse = page.waitForResponse((response) =>
    response.request().method() === "POST"
    && new URL(response.url()).pathname === "/purchases/confirm",
  );
  await page.getByRole("button", { name: "Confirmar compra" }).click();
  const confirmationResponse = await purchaseConfirmationResponse;
  expect(confirmationResponse.status()).toBe(201);
  const purchase = await confirmationResponse.json() as TestPurchase;

  // Assert
  const transactions = await listTransactions(api, user);
  const installments = transactions.filter((item) => item.purchase_id === purchase.id);
  expect(installments, JSON.stringify(transactions)).toHaveLength(3);
  expect(installments.map((item) => cents(item.estimated_amount)).sort((a, b) => b - a)).toEqual([3334, 3333, 3333]);
  expect(installments.reduce((sum, item) => sum + cents(item.estimated_amount), 0)).toBe(10_000);
  expect(installments.filter((item) => item.due_date === changedDate)).toHaveLength(1);
  expect(installments.filter((item) => item.purchase_id !== null)).toHaveLength(3);
});
