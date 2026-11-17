import type { components } from "../../src/api/schema";
import { assertNumberField, assertRecord, assertStringField, TestApi } from "./api";
import type { TestUser } from "./users";

export type TestCategory = components["schemas"]["CategoryResponse"];

export async function createCategory(
  api: TestApi,
  user: TestUser,
  input: components["schemas"]["CategoryCreate"],
): Promise<TestCategory> {
  const category = await api.send<TestCategory>("POST", "/categories", {
    token: user.accessToken,
    body: input,
    expectedStatus: 201,
  });
  assertRecord(category, "POST /categories");
  assertNumberField(category, "id", "POST /categories");
  assertStringField(category, "name", "POST /categories");
  if (category.name !== input.name) throw new Error("POST /categories returned a different category name");
  return category;
}
