import type { components } from "../../src/api/schema";
import { assertArray, assertNumberField, assertRecord, assertStringField, TestApi } from "./api";
import type { TestUser } from "./users";

export type TestPurchase = components["schemas"]["PurchaseResponse"];

export async function createInstallmentPurchase(
  api: TestApi,
  user: TestUser,
  input: components["schemas"]["PurchaseSimulationRequest"],
): Promise<TestPurchase> {
  const preview = await api.send<components["schemas"]["PurchasePreview"]>("POST", "/purchases/simulate", {
    token: user.accessToken,
    body: input,
  });
  assertRecord(preview, "POST /purchases/simulate");
  assertArray(preview.installments, "POST /purchases/simulate.installments");
  if (preview.installments.length !== input.installment_total) {
    throw new Error("POST /purchases/simulate returned an unexpected installment count");
  }

  const confirmation: components["schemas"]["PurchaseConfirmRequest"] = {
    ...input,
    installments: preview.installments.map(({ amount, due_date }) => ({ amount, due_date })),
  };
  const purchase = await api.send<TestPurchase>("POST", "/purchases/confirm", {
    token: user.accessToken,
    body: confirmation,
    expectedStatus: 201,
  });
  assertRecord(purchase, "POST /purchases/confirm");
  assertNumberField(purchase, "id", "POST /purchases/confirm");
  assertStringField(purchase, "description", "POST /purchases/confirm");
  if (purchase.installment_total !== input.installment_total) {
    throw new Error("POST /purchases/confirm returned an unexpected installment count");
  }
  return purchase;
}
