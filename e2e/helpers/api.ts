import type { APIRequestContext } from "@playwright/test";

export type ApiMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export type ApiOptions = Readonly<{
  token?: string;
  body?: unknown;
  expectedStatus?: number;
}>;

export class TestApi {
  constructor(
    private readonly requestContext: APIRequestContext,
    private readonly baseURL = process.env.E2E_API_URL ?? "http://127.0.0.1:8000",
  ) {}

  async send<TResponse>(method: ApiMethod, path: string, options: ApiOptions = {}): Promise<TResponse> {
    const url = new URL(path, this.baseURL);
    const headers: Record<string, string> = {};
    if (options.token) headers.Authorization = `Bearer ${options.token}`;
    if (options.body !== undefined) headers["Content-Type"] = "application/json";

    const response = await this.requestContext.fetch(url.toString(), {
      method,
      headers,
      data: options.body === undefined ? undefined : JSON.stringify(options.body),
      failOnStatusCode: false,
    });
    const responseBody = await response.text();
    const expectedStatus = options.expectedStatus ?? 200;

    if (response.status() !== expectedStatus) {
      throw new Error(
        `${method} ${url.pathname}${url.search} returned ${response.status()} (expected ${expectedStatus}): ${responseBody || "<empty response>"}`,
      );
    }

    if (!responseBody) return undefined as TResponse;
    try {
      return JSON.parse(responseBody) as TResponse;
    } catch {
      throw new Error(`${method} ${url.pathname} returned invalid JSON: ${responseBody}`);
    }
  }
}

export function assertRecord(value: unknown, description: string): asserts value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${description} did not match the OpenAPI object response`);
  }
}

export function assertArray(value: unknown, description: string): asserts value is unknown[] {
  if (!Array.isArray(value)) throw new Error(`${description} did not match the OpenAPI array response`);
}

export function assertNumberField(record: Record<string, unknown>, key: string, description: string): void {
  if (typeof record[key] !== "number") {
    throw new Error(`${description}.${key} did not match the OpenAPI number field`);
  }
}

export function assertStringField(record: Record<string, unknown>, key: string, description: string): void {
  if (typeof record[key] !== "string") {
    throw new Error(`${description}.${key} did not match the OpenAPI string field`);
  }
}
