import type { components } from "../../src/api/schema";
import { assertNumberField, assertRecord, assertStringField, TestApi } from "./api";
import type { TestUser } from "./users";

export type TestAccount = components["schemas"]["AccountResponse"];

export async function createAccount(
  api: TestApi,
  user: TestUser,
  input: components["schemas"]["AccountCreate"],
): Promise<TestAccount> {
  const account = await api.send<TestAccount>("POST", "/accounts", {
    token: user.accessToken,
    body: input,
    expectedStatus: 201,
  });
  assertRecord(account, "POST /accounts");
  assertNumberField(account, "id", "POST /accounts");
  assertStringField(account, "name", "POST /accounts");
  assertStringField(account, "current_balance", "POST /accounts");
  if (account.name !== input.name) throw new Error("POST /accounts returned a different account name");
  return account;
}

export async function listAccounts(api: TestApi, user: TestUser): Promise<TestAccount[]> {
  const accounts = await api.send<TestAccount[]>("GET", "/accounts", { token: user.accessToken });
  if (!Array.isArray(accounts)) throw new Error("GET /accounts did not match the OpenAPI array response");
  return accounts;
}

export async function getAccount(api: TestApi, user: TestUser, accountId: number): Promise<TestAccount> {
  const account = await api.send<TestAccount>("GET", `/accounts/${accountId}`, { token: user.accessToken });
  assertRecord(account, `GET /accounts/${accountId}`);
  assertNumberField(account, "id", `GET /accounts/${accountId}`);
  assertStringField(account, "current_balance", `GET /accounts/${accountId}`);
  return account;
}
