import { describe, expect, it } from "vitest";
import { filterInvoiceTransactions } from "./invoice-items";

describe("filterInvoiceTransactions", () => {
  it("returns only transactions linked to the invoice, excluding its payment", () => {
    const transactions = [
      { id: 1, invoice_id: 10 },
      { id: 2, invoice_id: 11 },
      { id: 3, invoice_id: 10 },
      { id: 4, invoice_id: null },
    ];

    expect(filterInvoiceTransactions(transactions, 10, 3)).toEqual([
      { id: 1, invoice_id: 10 },
    ]);
  });
});
