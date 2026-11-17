import { randomUUID } from "node:crypto";
import { test, expect, loginThroughUi } from "../fixtures/test";
import { createAccount, getAccount, listAccounts } from "../helpers/accounts";
import { createCategory } from "../helpers/categories";
import { createCreditCard } from "../helpers/credit-cards";
import { localToday } from "../helpers/dates";
import { getInvoice, listInvoices } from "../helpers/invoices";
import { createInstallmentPurchase } from "../helpers/purchases";
import { createPendingExpense, getTransaction, listTransactions } from "../helpers/transactions";
import { createTestUser } from "../helpers/users";

test("a second user cannot see, fetch, modify, or delete another user's records", async ({ api, page, user: owner }) => {
  // Arrange
  const account = await createAccount(api, owner, {
    name: `Private account ${randomUUID()}`,
    account_type: "BANK",
    initial_balance: "500.00",
  });
  const category = await createCategory(api, owner, {
    name: `Private category ${randomUUID()}`,
    direction: "EXPENSE",
  });
  const transaction = await createPendingExpense(api, owner, {
    account_id: account.id,
    category_id: category.id,
    description: `Private transaction ${randomUUID()}`,
    estimated_amount: "25.00",
    due_date: localToday(),
    amount_locked: false,
  });
  const card = await createCreditCard(api, owner, {
    name: `Private card ${randomUUID()}`,
    closing_day: 25,
    due_day: 10,
    suggested_payment_account_id: account.id,
  });
  const purchase = await createInstallmentPurchase(api, owner, {
    description: `Private purchase ${randomUUID()}`,
    total_amount: "90.00",
    purchase_date: localToday(),
    installment_total: 1,
    credit_card_id: card.id,
    category_id: category.id,
  });
  const ownerInvoice = (await listInvoices(api, owner))
    .find((invoice) => invoice.credit_card_id === card.id);
  expect(ownerInvoice).toBeDefined();
  expect((await listTransactions(api, owner)).some((item) => item.purchase_id === purchase.id)).toBe(true);
  const ownerAccountBefore = await getAccount(api, owner, account.id);
  const ownerInvoiceBefore = await getInvoice(api, owner, ownerInvoice!.id);
  const otherUser = await createTestUser(api);
  await loginThroughUi(page, otherUser);

  // Act and assert: the authenticated UI lists only the second user's resources.
  await page.goto("/accounts");
  await expect(page.getByText("Você ainda não cadastrou contas.")).toBeVisible();
  await page.goto("/transactions");
  await expect(page.getByText("Nenhuma transação encontrada para estes filtros.")).toBeVisible();
  await page.goto("/invoices");
  await expect(page.getByText("Nenhuma fatura encontrada.")).toBeVisible();

  // Assert: protected collection and record endpoints are user-scoped.
  expect(await listAccounts(api, otherUser)).toEqual([]);
  expect(await listTransactions(api, otherUser)).toEqual([]);
  expect(await listInvoices(api, otherUser)).toEqual([]);
  await api.send<unknown>("GET", `/accounts/${account.id}`, { token: otherUser.accessToken, expectedStatus: 404 });
  await api.send<unknown>("GET", `/transactions/${transaction.id}`, { token: otherUser.accessToken, expectedStatus: 404 });
  await api.send<unknown>("GET", `/invoices/${ownerInvoice!.id}?today=${localToday()}`, {
    token: otherUser.accessToken,
    expectedStatus: 404,
  });

  // Act and assert: attempts to update or delete another user's records are rejected.
  await api.send<unknown>("PATCH", `/accounts/${account.id}`, {
    token: otherUser.accessToken,
    body: { name: "Unauthorized update" },
    expectedStatus: 404,
  });
  await api.send<unknown>("DELETE", `/accounts/${account.id}`, {
    token: otherUser.accessToken,
    expectedStatus: 404,
  });
  await api.send<unknown>("PATCH", `/transactions/${transaction.id}`, {
    token: otherUser.accessToken,
    body: { description: "Unauthorized update" },
    expectedStatus: 404,
  });
  await api.send<unknown>("DELETE", `/transactions/${transaction.id}`, {
    token: otherUser.accessToken,
    expectedStatus: 404,
  });

  // Assert: failed cross-user operations leave the owner's state unchanged.
  expect((await getAccount(api, owner, account.id)).current_balance).toBe(ownerAccountBefore.current_balance);
  expect((await getTransaction(api, owner, transaction.id)).description).toBe(transaction.description);
  expect((await getInvoice(api, owner, ownerInvoice!.id)).payment_transaction_id)
    .toBe(ownerInvoiceBefore.payment_transaction_id);
});
