import type { components } from "../../src/api/schema";
import { assertArray, assertNumberField, assertRecord, assertStringField, TestApi } from "./api";
import type { TestUser } from "./users";

export type TestRecurrence = components["schemas"]["RecurrenceResponse"];

export async function createRecurringTransaction(
  api: TestApi,
  user: TestUser,
  input: components["schemas"]["RecurrenceCreate"],
): Promise<TestRecurrence> {
  const preview = await api.send<components["schemas"]["RecurrencePreview"]>("POST", "/recurrence-rules/simulate", {
    token: user.accessToken,
    body: input,
  });
  assertRecord(preview, "POST /recurrence-rules/simulate");
  assertArray(preview.occurrences, "POST /recurrence-rules/simulate.occurrences");
  if (preview.occurrences.length !== input.count) {
    throw new Error("POST /recurrence-rules/simulate returned an unexpected occurrence count");
  }

  const confirmation: components["schemas"]["RecurrenceConfirm"] = {
    ...input,
    occurrences: preview.occurrences.map(({ due_date, estimated_amount }) => ({ due_date, estimated_amount })),
  };
  const recurrence = await api.send<TestRecurrence>("POST", "/recurrence-rules/confirm", {
    token: user.accessToken,
    body: confirmation,
    expectedStatus: 201,
  });
  assertRecord(recurrence, "POST /recurrence-rules/confirm");
  assertNumberField(recurrence, "id", "POST /recurrence-rules/confirm");
  assertStringField(recurrence, "description", "POST /recurrence-rules/confirm");
  return recurrence;
}
