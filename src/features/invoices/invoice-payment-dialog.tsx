"use client";

import { useState } from "react";
import { Button, Dialog } from "@/components/ui";
import { InvoicePaymentForm } from "./invoice-payment-form";
import type { Invoice } from "./types";

export function InvoicePaymentDialog({ invoice, invoiceTotal }: Readonly<{ invoice: Invoice; invoiceTotal?: string }>) {
  const [open, setOpen] = useState(false);
  if (invoice.status === "PAID") return null;
  return <>
    <Button onClick={() => setOpen(true)} type="button">Pagar fatura</Button>
    <Dialog open={open} onClose={() => setOpen(false)} title="Pagar fatura">
      <InvoicePaymentForm invoice={invoice} invoiceTotal={invoiceTotal} onClose={() => setOpen(false)} />
    </Dialog>
  </>;
}
