import type { components } from "../../src/api/schema";
import { assertNumberField, assertRecord, assertStringField, TestApi } from "./api";
import type { TestUser } from "./users";

export type TestCreditCard = components["schemas"]["CreditCardResponse"];

export async function createCreditCard(
  api: TestApi,
  user: TestUser,
  input: components["schemas"]["CreditCardCreate"],
): Promise<TestCreditCard> {
  const card = await api.send<TestCreditCard>("POST", "/credit-cards", {
    token: user.accessToken,
    body: input,
    expectedStatus: 201,
  });
  assertRecord(card, "POST /credit-cards");
  assertNumberField(card, "id", "POST /credit-cards");
  assertStringField(card, "name", "POST /credit-cards");
  if (card.name !== input.name) throw new Error("POST /credit-cards returned a different card name");
  return card;
}
