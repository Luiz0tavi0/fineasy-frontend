# FinEasy E2E

## API, UI, and assertion map

| Scenario | Arrange through FastAPI | Act through the frontend | Assert in UI and/or FastAPI |
| --- | --- | --- | --- |
| Account balance lifecycle | `POST /auth/register`, `POST /auth/token`, `POST /accounts` | `/transactions/new`, `/transactions`; create, complete, edit, and cancel a transaction | Account balance on `/accounts`; `GET /accounts`, `GET /transactions`, `GET /transactions/{transaction_id}` |
| Account transfer | Register/login; create two accounts with `POST /accounts` | `/transfers` | Both account balances; `GET /accounts`, `GET /transfers`, `GET /transactions` |
| Installments | Register/login; create account and category with `POST /accounts` and `POST /categories` | `/purchases`; simulate, edit a preview date, confirm | `GET /transactions` by purchase/installment identifiers; verify amounts, dates, and count |
| Card invoice payment | Register/login; create account/card with `POST /accounts` and `POST /credit-cards` | `/purchases`, `/transactions`, `/invoices/{invoice_id}` | `GET /invoices/{invoice_id}`, `GET /accounts`, `GET /transactions`; retry payment through `POST /invoices/{invoice_id}/pay` and verify `409` |
| Variable recurrence | Register/login; create account/category | `/recurrences`, `/transactions`; complete occurrences | `GET /recurrence-rules`, `GET /transactions`, `GET /accounts` |
| Authentication/session | Register via `POST /auth/register` only; use the browser login form | `/login`, reload protected pages, expire/replace cookies in the test context | Authenticated UI, browser cookies, and `GET /auth/me`; refresh behavior is exercised through the frontend API bridge |
| User isolation | Register/login two separate users; create User A-owned resources | Log in as User B and visit `/accounts`, `/transactions`, `/invoices` | UI lists and authenticated API reads/mutations for User B; verify User A resources remain unchanged |

`openapi.json` is the contract source for helper request/response types and status
codes. The backend also has unit/integration coverage for balance deltas, variable
recurrence re-estimation, invoice residuals, and ownership checks; those tests are
the business-rule reference where OpenAPI does not specify behavior.

## Frontend behavior addressed for E2E

- Purchase preview dates are editable before confirmation.
- Invoice-linked card installments do not expose manual completion; payment goes through the invoice.
- Invoice payment accepts the API's separate interest/late-fee amounts and category IDs and shows payment impact.
- Session persistence, valid access-token refresh, and invalid-refresh logout are verified through the frontend and its HttpOnly cookie bridge.

The variable-recurrence E2E currently exposes a backend discrepancy: pending
estimates lag the completed values by one occurrence (after completing R$80.00
and R$90.00 they remain R$80.00 rather than R$85.00). The runtime session is
configured with `autoflush=False`, while re-estimation queries completed rows
before the just-completed transaction is flushed. The test continues through the
lock behavior and retains the expected values as soft assertions, reporting the
mismatch without changing backend business logic or masking it.

Do not point E2E tests at the regular development or production database.

## Run locally

Requirements: Docker, `uv`, the sibling `fineasy-backend` checkout, and the
backend's locked Python environment. Playwright starts the backend (after
applying its migrations) and builds/starts the Next.js production server; it
refuses non-loopback API/frontend URLs and databases not named `fineasy_e2e`.

```bash
pnpm e2e:db:up
pnpm exec playwright install chromium
pnpm e2e
pnpm e2e:db:down
```

The database uses a dedicated PostgreSQL container on `127.0.0.1:55432` with
data in a temporary filesystem; stopping it discards all test data. E2E user
records are additionally isolated by unique user IDs per test. Do not run
`e2e:db:down` against the backend's regular `docker-compose.yml`.

Configuration overrides:

- `E2E_DATABASE_URL`: local disposable database URL; defaults to
  `postgresql+psycopg://fineasy_e2e:fineasy_e2e@127.0.0.1:55432/fineasy_e2e`.
- `E2E_API_URL`: local backend URL; defaults to `http://127.0.0.1:8000`.
- `E2E_BASE_URL`: local frontend URL; defaults to `http://localhost:3000`.
- `E2E_BACKEND_DIR`: backend checkout path; defaults to `../fineasy-backend`.
- `E2E_SECRET_KEY`: test-only backend signing key override.

`pnpm exec playwright test e2e/transactions` runs a selected spec path. Use
`pnpm e2e:headed` for a visible browser, `pnpm e2e:ui` for Playwright UI mode,
and `pnpm e2e:report` to open the HTML report.
