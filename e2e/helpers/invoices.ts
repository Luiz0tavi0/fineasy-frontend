import type { components } from "../../src/api/schema";
import { assertArray, assertNumberField, assertRecord, assertStringField, TestApi } from "./api";
import { localToday } from "./dates";
import type { TestUser } from "./users";

export type TestInvoice = components["schemas"]["InvoiceSummaryResponse"];

export async function listInvoices(api: TestApi, user: TestUser, date = localToday()): Promise<TestInvoice[]> {
  const invoices = await api.send<TestInvoice[]>("GET", `/invoices?today=${date}`, { token: user.accessToken });
  assertArray(invoices, "GET /invoices");
  for (const [index, invoice] of invoices.entries()) {
    assertRecord(invoice, `GET /invoices[${index}]`);
    assertNumberField(invoice, "id", `GET /invoices[${index}]`);
    assertStringField(invoice, "total_amount", `GET /invoices[${index}]`);
  }
  return invoices as TestInvoice[];
}

export async function getInvoice(
  api: TestApi,
  user: TestUser,
  invoiceId: number,
  date = localToday(),
): Promise<components["schemas"]["InvoiceDetailResponse"]> {
  const invoice = await api.send<components["schemas"]["InvoiceDetailResponse"]>(
    "GET",
    `/invoices/${invoiceId}?today=${date}`,
    { token: user.accessToken },
  );
  assertRecord(invoice, `GET /invoices/${invoiceId}`);
  assertNumberField(invoice, "id", `GET /invoices/${invoiceId}`);
  assertStringField(invoice, "status", `GET /invoices/${invoiceId}`);
  return invoice;
}
