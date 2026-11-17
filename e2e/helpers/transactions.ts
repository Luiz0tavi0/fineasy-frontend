import type { components } from "../../src/api/schema";
import { assertArray, assertNumberField, assertRecord, assertStringField, TestApi } from "./api";
import { localToday } from "./dates";
import type { TestUser } from "./users";

export type TestTransaction = components["schemas"]["TransactionResponse"];

export async function createPendingExpense(
  api: TestApi,
  user: TestUser,
  input: Omit<components["schemas"]["TransactionCreate"], "direction" | "status">,
): Promise<TestTransaction> {
  const body: components["schemas"]["TransactionCreate"] = {
    ...input,
    direction: "EXPENSE",
    status: "PENDING",
  };
  const transaction = await api.send<TestTransaction>("POST", "/transactions", {
    token: user.accessToken,
    body,
    expectedStatus: 201,
  });
  assertRecord(transaction, "POST /transactions");
  assertNumberField(transaction, "id", "POST /transactions");
  assertStringField(transaction, "description", "POST /transactions");
  return transaction;
}

export async function listTransactions(api: TestApi, user: TestUser): Promise<TestTransaction[]> {
  const firstYear = Number(localToday().slice(0, 4));
  const transactions = await api.send<TestTransaction[]>(
    "GET",
    `/transactions?start_date=${firstYear}-01-01&end_date=${firstYear + 5}-12-31&per_page=100`,
    {
    token: user.accessToken,
    },
  );
  assertArray(transactions, "GET /transactions");
  for (const [index, transaction] of transactions.entries()) {
    assertRecord(transaction, `GET /transactions[${index}]`);
    assertNumberField(transaction, "id", `GET /transactions[${index}]`);
    assertStringField(transaction, "description", `GET /transactions[${index}]`);
  }
  return transactions as TestTransaction[];
}

export async function getTransaction(
  api: TestApi,
  user: TestUser,
  transactionId: number,
): Promise<TestTransaction> {
  const transaction = await api.send<TestTransaction>("GET", `/transactions/${transactionId}`, {
    token: user.accessToken,
  });
  assertRecord(transaction, `GET /transactions/${transactionId}`);
  assertNumberField(transaction, "id", `GET /transactions/${transactionId}`);
  assertStringField(transaction, "description", `GET /transactions/${transactionId}`);
  return transaction;
}
