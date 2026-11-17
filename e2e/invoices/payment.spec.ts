import { randomUUID } from "node:crypto";
import { test, expect, loginThroughUi } from "../fixtures/test";
import { createAccount, getAccount } from "../helpers/accounts";
import { createCategory } from "../helpers/categories";
import { createCreditCard } from "../helpers/credit-cards";
import { localToday } from "../helpers/dates";
import { cents } from "../helpers/money";
import { getInvoice, listInvoices } from "../helpers/invoices";
import { createInstallmentPurchase } from "../helpers/purchases";
import { listTransactions } from "../helpers/transactions";

test("card installments settle through invoice payment and reject duplicate payment", async ({ api, page, user }) => {
  // Arrange
  const account = await createAccount(api, user, {
    name: "Invoice payment account",
    account_type: "BANK",
    initial_balance: "1000.00",
  });
  const category = await createCategory(api, user, {
    name: `Card purchase ${randomUUID()}`,
    direction: "EXPENSE",
  });
  const card = await createCreditCard(api, user, {
    name: `Test card ${randomUUID()}`,
    closing_day: 25,
    due_day: 10,
    suggested_payment_account_id: account.id,
  });
  const description = `Invoice installment ${randomUUID()}`;
  const purchase = await createInstallmentPurchase(api, user, {
    description,
    total_amount: "90.00",
    purchase_date: localToday(),
    installment_total: 3,
    credit_card_id: card.id,
    category_id: category.id,
  });
  const purchaseTransactions = (await listTransactions(api, user))
    .filter((item) => item.purchase_id === purchase.id);
  expect(purchaseTransactions).toHaveLength(3);
  expect(purchaseTransactions.every((item) => item.invoice_id !== null)).toBe(true);

  const invoices = await listInvoices(api, user);
  const invoice = invoices.find((item) => item.credit_card_id === card.id && cents(item.total_amount) > 1);
  expect(invoice).toBeDefined();
  const invoiceItems = purchaseTransactions.filter((item) => item.invoice_id === invoice!.id);
  expect(invoiceItems.length).toBeGreaterThan(0);
  const invoiceTotalCents = cents(invoice!.total_amount);
  const paymentCents = Math.max(1, Math.floor(invoiceTotalCents / 2));
  const paymentAmount = (paymentCents / 100).toFixed(2);
  const residualCents = invoiceTotalCents - paymentCents;
  const residualAmount = (residualCents / 100).toFixed(2);
  await loginThroughUi(page, user);

  // Act
  await page.goto(`/transactions/${invoiceItems[0]!.id}`);

  // Assert
  await expect(page.getByRole("button", { name: "Concluir", exact: true })).toHaveCount(0);

  // Act
  await page.goto(`/invoices/${invoice!.id}`);
  await expect(page.getByText(/Parcela \d\/3/).first()).toBeVisible();
  await page.getByRole("button", { name: "Pagar fatura" }).click();
  const paymentDialog = page.getByRole("dialog");
  await paymentDialog.getByLabel("Conta de pagamento").selectOption(String(account.id));
  await paymentDialog.getByLabel("Valor pago").fill(paymentAmount);
  await expect(paymentDialog.getByText(/Saldo para a próxima fatura/)).toContainText(
    new RegExp(`R\\$\\s*${residualAmount.replace(".", ",")}`),
  );
  await paymentDialog.getByRole("button", { name: "Registrar pagamento" }).click();

  // Assert
  await expect(page.getByText("Pagamento registrado.", { exact: true })).toBeVisible();
  const paidInvoice = await getInvoice(api, user, invoice!.id);
  expect(paidInvoice.status).toBe("PAID");
  expect(paidInvoice.payment_transaction_id).not.toBeNull();
  expect(cents((await getAccount(api, user, account.id)).current_balance)).toBe(100_000 - paymentCents);
  const residualInvoices = (await listInvoices(api, user))
    .filter((item) => item.id !== invoice!.id && cents(item.total_amount) === residualCents);
  expect(residualInvoices.length).toBeGreaterThan(0);
  const residuals = (await listTransactions(api, user))
    .filter((item) => item.invoice_id === residualInvoices[0]!.id && item.status === "PENDING");
  expect(residuals.some((item) => cents(item.estimated_amount) === residualCents)).toBe(true);

  // Act
  await page.getByRole("button", { name: "Pagar fatura" }).click();
  const duplicateDialog = page.getByRole("dialog");
  await duplicateDialog.getByLabel("Conta de pagamento").selectOption(String(account.id));
  await duplicateDialog.getByLabel("Valor pago").fill(paymentAmount);
  const duplicatePaymentResponse = page.waitForResponse((response) =>
    response.request().method() === "POST"
    && response.url().includes(`/invoices/${invoice!.id}/pay`),
  );
  await duplicateDialog.getByRole("button", { name: "Registrar pagamento" }).click();
  const duplicatePaymentResult = await duplicatePaymentResponse;

  // Assert
  expect(duplicatePaymentResult.status()).toBe(409);
  await expect(page.getByText("Invoice is already paid", { exact: true })).toBeVisible();
  const duplicatePayment = await api.send<unknown>("POST", `/invoices/${invoice!.id}/pay`, {
    token: user.accessToken,
    body: {
      account_id: account.id,
      amount: paymentAmount,
      effective_date: localToday(),
      interest_amount: "0.00",
      late_fee_amount: "0.00",
    },
    expectedStatus: 409,
  });
  expect(duplicatePayment).toBeDefined();
  expect(cents((await getAccount(api, user, account.id)).current_balance)).toBe(100_000 - paymentCents);
  expect((await getInvoice(api, user, invoice!.id)).payment_transaction_id).toBe(paidInvoice.payment_transaction_id);
});
