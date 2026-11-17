"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button, Field, Input, Select } from "@/components/ui";
import { today } from "@/lib/today";
import { invoicePaymentSchema } from "./schemas";
import { usePayInvoice } from "./mutations";
import { useAccountsQuery } from "@/features/accounts";
import { useCategoriesQuery } from "@/features/categories";
import { addMoney, formatBRL, parseMoney } from "@/lib/money";
import { formatDateBR } from "@/lib/dates";
import type { Invoice } from "./types";
import type { z } from "zod";

type PaymentValues = z.infer<typeof invoicePaymentSchema>;

export function InvoicePaymentForm({ invoice, invoiceTotal, onClose }: Readonly<{ invoice: Invoice; invoiceTotal?: string; onClose: () => void }>) {
  const accounts = useAccountsQuery();
  const categories = useCategoriesQuery();
  const pay = usePayInvoice();
  const form = useForm<z.input<typeof invoicePaymentSchema>, undefined, PaymentValues>({
    resolver: zodResolver(invoicePaymentSchema),
    defaultValues: {
      account_id: 0,
      amount: invoiceTotal ?? "",
      interest_amount: "0.00",
      interest_category_id: "",
      late_fee_amount: "0.00",
      late_fee_category_id: "",
      effective_date: today(),
    },
  });
  const values = form.watch();
  const amountIsValid = Boolean(values.amount && /^\d+(\.\d{1,2})?$/.test(values.amount) && parseMoney(values.amount).greaterThan(0));
  const interestIsValid = Boolean(values.interest_amount && /^\d+(\.\d{1,2})?$/.test(values.interest_amount));
  const lateFeeIsValid = Boolean(values.late_fee_amount && /^\d+(\.\d{1,2})?$/.test(values.late_fee_amount));
  const total = amountIsValid && interestIsValid && lateFeeIsValid
    ? addMoney(addMoney(values.amount, values.interest_amount), values.late_fee_amount)
    : null;
  const account = accounts.data?.find((item) => item.id === Number(values.account_id));
  const expenseCategories = (categories.data ?? []).filter((category) => category.direction !== "INCOME");
  return <form className="space-y-4" onSubmit={form.handleSubmit((body) => pay.mutate({ id: invoice.id, body }, { onSuccess: onClose }))}>
    {invoiceTotal !== undefined && <section className="rounded-lg bg-slate-50 p-3 text-sm">
      <h3 className="font-medium">Resumo da fatura #{invoice.id}</h3>
      <p className="mt-1 text-slate-600">Vencimento em {formatDateBR(invoice.due_date)} · valor dos itens {formatBRL(invoiceTotal)}</p>
    </section>}
    <Field label="Conta de pagamento" error={form.formState.errors.account_id?.message}><Select {...form.register("account_id")}><option value="0">Selecione</option>{(accounts.data ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field>
    <Field label="Valor pago" error={form.formState.errors.amount?.message}><Input inputMode="decimal" type="text" {...form.register("amount")} /></Field>
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Juros" error={form.formState.errors.interest_amount?.message}><Input inputMode="decimal" type="text" {...form.register("interest_amount")} /></Field>
      <Field label="Categoria dos juros" error={form.formState.errors.interest_category_id?.message}>
        <Select {...form.register("interest_category_id")}><option value="">Selecione</option>{expenseCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</Select>
      </Field>
    </div>
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Multa" error={form.formState.errors.late_fee_amount?.message}><Input inputMode="decimal" type="text" {...form.register("late_fee_amount")} /></Field>
      <Field label="Categoria da multa" error={form.formState.errors.late_fee_category_id?.message}>
        <Select {...form.register("late_fee_category_id")}><option value="">Selecione</option>{expenseCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</Select>
      </Field>
    </div>
    <Field label="Data efetiva" error={form.formState.errors.effective_date?.message}><Input type="date" {...form.register("effective_date")} /></Field>
    {total !== null && <section aria-live="polite" className="rounded-lg border p-3 text-sm">
      <p className="flex justify-between"><span>Juros</span><strong>{formatBRL(values.interest_amount)}</strong></p>
      <p className="mt-1 flex justify-between"><span>Multa</span><strong>{formatBRL(values.late_fee_amount)}</strong></p>
      <p className="mt-1 flex justify-between"><span>Total a pagar</span><strong>{formatBRL(total)}</strong></p>
      {invoiceTotal !== undefined && parseMoney(values.amount).lessThan(invoiceTotal) && <p className="mt-1 text-slate-600">Saldo para a próxima fatura: {formatBRL(parseMoney(invoiceTotal).minus(values.amount))}</p>}
      {account && <p className="mt-1 text-slate-600">Saldo após o pagamento: {formatBRL(parseMoney(account.current_balance).minus(total))}</p>}
    </section>}
    <Button disabled={pay.isPending || accounts.isPending || categories.isPending} type="submit">{pay.isPending ? "Registrando…" : "Registrar pagamento"}</Button>
  </form>;
}
