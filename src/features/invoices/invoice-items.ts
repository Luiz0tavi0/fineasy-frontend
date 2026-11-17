type InvoiceLinkedTransaction = Readonly<{ id: number; invoice_id: number | null }>;

export function filterInvoiceTransactions<T extends InvoiceLinkedTransaction>(
  transactions: readonly T[],
  invoiceId: number,
  paymentTransactionId: number | null,
): T[] {
  return transactions.filter((transaction) =>
    transaction.invoice_id === invoiceId && transaction.id !== paymentTransactionId
  );
}
