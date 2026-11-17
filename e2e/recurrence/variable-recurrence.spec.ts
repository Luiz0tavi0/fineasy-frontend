import { randomUUID } from "node:crypto";
import { test, expect, loginThroughUi } from "../fixtures/test";
import { createAccount } from "../helpers/accounts";
import { createCategory } from "../helpers/categories";
import { firstOfNextMonth, localToday } from "../helpers/dates";
import { cents } from "../helpers/money";
import { createRecurringTransaction } from "../helpers/recurrence";
import { listTransactions } from "../helpers/transactions";

test("variable recurrence re-estimates pending occurrences and preserves locked estimates", async ({ api, page, user }) => {
  // Arrange
  const account = await createAccount(api, user, {
    name: "Variable recurrence account",
    account_type: "BANK",
    initial_balance: "5000.00",
  });
  const category = await createCategory(api, user, {
    name: `Variable expense ${randomUUID()}`,
    direction: "EXPENSE",
  });
  const description = `Variable recurrence ${randomUUID()}`;
  const recurrence = await createRecurringTransaction(api, user, {
    description,
    account_id: account.id,
    category_id: category.id,
    anchor_day: 2,
    start_month: firstOfNextMonth(localToday()),
    count: 15,
    variable_amount: true,
    estimated_amount: "80.00",
    direction: "EXPENSE",
  });
  expect(recurrence.variable_amount).toBe(true);
  const occurrences = (await listTransactions(api, user))
    .filter((item) => item.recurrence_rule_id === recurrence.id)
    .sort((left, right) => left.due_date.localeCompare(right.due_date));
  expect(occurrences).toHaveLength(15);
  await loginThroughUi(page, user);

  async function completeOccurrence(index: number, amount: string): Promise<void> {
    const occurrence = occurrences[index];
    if (!occurrence) throw new Error(`Missing recurrence occurrence ${index + 1}`);
    await page.goto("/transactions");
    await page.getByLabel("Mês").fill(occurrence.due_date.slice(0, 7));
    const displayedDate = new Date(`${occurrence.due_date}T00:00:00Z`).toLocaleDateString("pt-BR", { timeZone: "UTC" });
    const row = page.getByRole("row")
      .filter({ has: page.getByText(description, { exact: true }) })
      .filter({ hasText: displayedDate });
    await expect(row).toHaveCount(1);
    await row.getByRole("button", { name: "Concluir" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Valor realizado").fill(amount);
    await dialog.getByLabel("Data efetiva").fill(occurrence.due_date);
    await dialog.getByRole("button", { name: "Concluir", exact: true }).click();
    await expect(dialog).toBeHidden();
  }

  // Act
  await completeOccurrence(0, "80.00");

  // Assert
  let pending = (await listTransactions(api, user))
    .filter((item) => item.recurrence_rule_id === recurrence.id && item.status === "PENDING");
  expect(pending).toHaveLength(14);
  expect(pending.every((item) => cents(item.estimated_amount) === 8_000)).toBe(true);

  // Act
  await completeOccurrence(1, "90.00");

  // Assert
  pending = (await listTransactions(api, user))
    .filter((item) => item.recurrence_rule_id === recurrence.id && item.status === "PENDING");
  const completedAfterSecond = (await listTransactions(api, user))
    .filter((item) => item.recurrence_rule_id === recurrence.id && item.status === "COMPLETED")
    .map(({ due_date, effective_date, amount }) => ({ due_date, effective_date, amount }));
  expect(completedAfterSecond).toHaveLength(2);
  expect(completedAfterSecond.map((item) => item.amount).sort()).toEqual(["80.00", "90.00"]);
  expect(completedAfterSecond.map((item) => item.effective_date).sort())
    .toEqual(occurrences.slice(0, 2).map((item) => item.due_date).sort());
  expect(pending.every((item) => !item.amount_locked)).toBe(true);
  expect.soft([...new Set(pending.map((item) => cents(item.estimated_amount)))]).toEqual([8_500]);

  // Act
  await completeOccurrence(2, "100.00");

  // Assert
  pending = (await listTransactions(api, user))
    .filter((item) => item.recurrence_rule_id === recurrence.id && item.status === "PENDING")
    .sort((left, right) => left.due_date.localeCompare(right.due_date));
  expect.soft([...new Set(pending.map((item) => cents(item.estimated_amount)))]).toEqual([9_000]);
  const completedAfterThird = (await listTransactions(api, user))
    .filter((item) => item.recurrence_rule_id === recurrence.id && item.status === "COMPLETED");
  expect(completedAfterThird).toHaveLength(3);
  expect(completedAfterThird.map((item) => item.amount).sort()).toEqual(["100.00", "80.00", "90.00"]);
  const lockedOccurrence = occurrences[4];
  expect(lockedOccurrence).toBeDefined();

  // Act
  await page.goto("/transactions");
  await page.getByLabel("Mês").fill(lockedOccurrence!.due_date.slice(0, 7));
  const lockedRow = page.getByRole("row").filter({ has: page.getByText(description, { exact: true }) });
  await lockedRow.getByRole("button", { name: "Editar" }).click();
  const editDialog = page.getByRole("dialog");
  await editDialog.getByLabel("Manter valor previsto").check();
  await editDialog.getByRole("button", { name: "Salvar" }).click();
  await expect(editDialog).toBeHidden();

  // Assert
  const lockedBeforeCompletion = (await listTransactions(api, user))
    .find((item) => item.id === lockedOccurrence!.id);
  expect(lockedBeforeCompletion?.amount_locked).toBe(true);
  expect.soft(cents(lockedBeforeCompletion!.estimated_amount)).toBe(9_000);

  // Act
  await completeOccurrence(3, "120.00");

  // Assert
  const afterCompletion = await listTransactions(api, user);
  const stillLocked = afterCompletion.find((item) => item.id === lockedOccurrence!.id);
  expect(stillLocked?.status).toBe("PENDING");
  expect(stillLocked?.amount_locked).toBe(true);
  expect.soft(cents(stillLocked!.estimated_amount)).toBe(9_000);
  const unlocked = afterCompletion.find((item) => item.id === occurrences[5]!.id);
  expect.soft(cents(unlocked!.estimated_amount)).toBe(10_333);

});
