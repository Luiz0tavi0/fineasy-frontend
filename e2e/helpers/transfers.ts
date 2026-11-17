import type { components } from "../../src/api/schema";
import { assertArray, assertNumberField, assertRecord, assertStringField, TestApi } from "./api";
import type { TestUser } from "./users";

export type TestTransfer = components["schemas"]["TransferResponse"];

export async function listTransfers(api: TestApi, user: TestUser): Promise<TestTransfer[]> {
  const transfers = await api.send<TestTransfer[]>("GET", "/transfers", { token: user.accessToken });
  assertArray(transfers, "GET /transfers");
  for (const [index, transfer] of transfers.entries()) {
    assertRecord(transfer, `GET /transfers[${index}]`);
    assertNumberField(transfer, "id", `GET /transfers[${index}]`);
    assertStringField(transfer, "amount", `GET /transfers[${index}]`);
  }
  return transfers as TestTransfer[];
}
