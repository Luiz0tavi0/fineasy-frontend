import { randomUUID } from "node:crypto";
import type { components } from "../../src/api/schema";
import { assertNumberField, assertRecord, assertStringField, TestApi } from "./api";

type UserResponse = components["schemas"]["UserResponse"];
type TokenPair = components["schemas"]["TokenPair"];

export type TestUser = UserResponse & Readonly<{
  password: string;
  accessToken: string;
  refreshToken: string;
}>;

export async function createTestUser(api: TestApi): Promise<TestUser> {
  const credentials = {
    email: `e2e-${randomUUID()}@example.com`,
    password: `E2e-${randomUUID()}!aA9`,
  } satisfies components["schemas"]["Credentials"];

  const registered = await api.send<UserResponse>("POST", "/auth/register", {
    body: credentials,
    expectedStatus: 201,
  });
  assertRecord(registered, "POST /auth/register");
  assertNumberField(registered, "id", "POST /auth/register");
  assertStringField(registered, "email", "POST /auth/register");
  assertStringField(registered, "created_at", "POST /auth/register");

  const tokens = await api.send<TokenPair>("POST", "/auth/token", {
    body: credentials,
    expectedStatus: 200,
  });
  assertRecord(tokens, "POST /auth/token");
  assertStringField(tokens, "access_token", "POST /auth/token");
  assertStringField(tokens, "refresh_token", "POST /auth/token");
  if (tokens.token_type !== "bearer") throw new Error("POST /auth/token returned an unexpected token_type");

  const currentUser = await api.send<UserResponse>("GET", "/auth/me", { token: tokens.access_token });
  assertRecord(currentUser, "GET /auth/me");
  assertNumberField(currentUser, "id", "GET /auth/me");
  assertStringField(currentUser, "email", "GET /auth/me");
  if (currentUser.id !== registered.id || currentUser.email !== credentials.email) {
    throw new Error("GET /auth/me did not return the newly registered user");
  }

  return {
    ...currentUser,
    password: credentials.password,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
  };
}
