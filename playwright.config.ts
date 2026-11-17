import { defineConfig, devices } from "@playwright/test";

const apiURL = process.env.E2E_API_URL ?? "http://127.0.0.1:8000";
const frontendURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const databaseURL = process.env.E2E_DATABASE_URL
  ?? "postgresql+psycopg://fineasy_e2e:fineasy_e2e@127.0.0.1:55432/fineasy_e2e";

function assertLoopbackUrl(value: string, name: string): URL {
  const url = new URL(value);
  if (url.protocol !== "http:" || !["localhost", "127.0.0.1", "::1"].includes(url.hostname)) {
    throw new Error(`${name} must use a local http:// loopback URL`);
  }
  return url;
}

const api = assertLoopbackUrl(apiURL, "E2E_API_URL");
assertLoopbackUrl(frontendURL, "E2E_BASE_URL");
const database = new URL(databaseURL);
if (
  database.username !== "fineasy_e2e"
  || database.pathname !== "/fineasy_e2e"
  || !["localhost", "127.0.0.1", "::1"].includes(database.hostname)
) {
  throw new Error("E2E_DATABASE_URL must point to a dedicated local fineasy_e2e database");
}

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.ts",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
  use: {
    baseURL: frontendURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    ...devices["Desktop Chrome"],
    timezoneId: "America/Sao_Paulo",
  },
  webServer: [
    {
      command: "bash e2e/start-backend.sh",
      url: `${api.origin}/health`,
      timeout: 120_000,
      reuseExistingServer: false,
      env: {
        E2E_BACKEND_DIR: process.env.E2E_BACKEND_DIR ?? "../fineasy-backend",
        E2E_DATABASE_URL: databaseURL,
        E2E_API_PORT: api.port || "8000",
        E2E_SECRET_KEY: process.env.E2E_SECRET_KEY ?? "fineasy-e2e-only-development-key-012345",
      },
    },
    {
      command: `pnpm build && pnpm start --hostname 127.0.0.1 --port ${new URL(frontendURL).port || "3000"}`,
      url: `${frontendURL}/login`,
      timeout: 300_000,
      reuseExistingServer: false,
      env: { FASTAPI_URL: api.origin, NEXT_PUBLIC_API_URL: api.origin },
    },
  ],
});
