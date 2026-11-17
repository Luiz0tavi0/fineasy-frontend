"use client";

import Link from "next/link";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Badge, Button, ConfirmDialog, Dialog, EmptyState, Field, Input, Select, SecondaryButton } from "@/components/ui";
import { formatBRL } from "@/lib/money";
import { formatDateBR } from "@/lib/dates";
import { today } from "@/lib/today";
import { useAccountsQuery } from "@/features/accounts";
import { useCategoriesQuery } from "@/features/categories";
import { transactionCompleteSchema, transactionEditSchema } from "./schemas";
import { useTransactionsQuery, type TransactionFilters } from "./queries";
import { useCompleteTransaction, useDeleteTransaction, useUpdateTransaction } from "./mutations";
import type { Transaction } from "./types";
import type { z } from "zod";
import { parseMoney } from "@/lib/money";

type EditValues = z.infer<typeof transactionEditSchema>;
type CompleteValues = z.infer<typeof transactionCompleteSchema>;

const directionName = { EXPENSE: "Despesa", INCOME: "Receita" } as const;
const statusName = { PENDING: "Pendente", COMPLETED: "Concluída", CANCELLED: "Cancelada" } as const;

function EditTransactionForm({ transaction, onClose }: Readonly<{ transaction: Transaction; onClose: () => void }>) {
  const categories = useCategoriesQuery();
  const accounts = useAccountsQuery();
  const update = useUpdateTransaction();
  const form = useForm<z.input<typeof transactionEditSchema>, undefined, EditValues>({
    resolver: zodResolver(transactionEditSchema),
    defaultValues: {
      description: transaction.description,
      estimated_amount: transaction.estimated_amount,
      amount: transaction.amount ?? transaction.estimated_amount,
      due_date: transaction.due_date,
      effective_date: transaction.effective_date ?? transaction.due_date,
      category_id: transaction.category_id ?? "",
      amount_locked: transaction.amount_locked,
      competence: transaction.competence ?? "",
    },
  });
  const editedAmount = form.watch("amount");
  const amountDelta = editedAmount && /^\d+(\.\d{1,2})?$/.test(editedAmount) && parseMoney(editedAmount).greaterThan(0)
    ? parseMoney(editedAmount).minus(transaction.amount ?? transaction.estimated_amount)
    : null;
  const balanceDelta = amountDelta && transaction.direction === "EXPENSE" ? amountDelta.negated() : amountDelta;
  const account = accounts.data?.find((item) => item.id === transaction.account_id);
  const submit = (values: EditValues) => {
    if (transaction.status === "COMPLETED" && (!values.amount || !values.effective_date)) {
      if (!values.amount) form.setError("amount", { message: "Informe o valor realizado" });
      if (!values.effective_date) form.setError("effective_date", { message: "Informe a data efetiva" });
      return;
    }
    const body = transaction.status === "COMPLETED"
      ? {
          description: values.description,
          estimated_amount: values.estimated_amount,
          amount: values.amount,
          effective_date: values.effective_date,
          due_date: values.due_date,
          category_id: values.category_id,
          amount_locked: values.amount_locked,
          competence: values.competence,
        }
      : {
          description: values.description,
          estimated_amount: values.estimated_amount,
          due_date: values.due_date,
          category_id: values.category_id,
          amount_locked: values.amount_locked,
          competence: values.competence,
        };
    update.mutate({ id: transaction.id, body }, { onSuccess: onClose });
  };
  return <form className="space-y-4" onSubmit={form.handleSubmit(submit)}>
    <Field label="Descrição" error={form.formState.errors.description?.message}><Input {...form.register("description")} /></Field>
    <Field label="Valor previsto" error={form.formState.errors.estimated_amount?.message}><Input inputMode="decimal" type="text" {...form.register("estimated_amount")} /></Field>
    {transaction.status === "COMPLETED" && <>
      <Field label="Valor realizado" error={form.formState.errors.amount?.message}><Input inputMode="decimal" type="text" {...form.register("amount")} /></Field>
      <Field label="Data efetiva" error={form.formState.errors.effective_date?.message}><Input type="date" {...form.register("effective_date")} /></Field>
      {amountDelta && balanceDelta && <section aria-live="polite" className="rounded-lg bg-slate-50 p-3 text-sm">
        <h3 className="font-medium">Impacto previsto</h3>
        {balanceDelta.isZero()
          ? <p className="mt-1 text-slate-600">O saldo da conta não será alterado pelo valor.</p>
          : <p className="mt-1 text-slate-600">Saldo da conta: {formatBRL(balanceDelta)} de variação{account ? ` · novo saldo estimado ${formatBRL(parseMoney(account.current_balance).plus(balanceDelta))}` : ""}.</p>}
        {transaction.invoice_id !== null && <p className="mt-1 text-slate-600">
          Fatura #{transaction.invoice_id}: {amountDelta.isZero() ? "sem alteração no total" : `${formatBRL(amountDelta.abs())} ${amountDelta.isPositive() ? "a mais" : "a menos"}`}.
        </p>}
      </section>}
    </>}
    <Field label="Vencimento" error={form.formState.errors.due_date?.message}><Input type="date" {...form.register("due_date")} /></Field>
    <Field label="Categoria"><Select {...form.register("category_id")}><option value="">Sem categoria</option>{(categories.data ?? []).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</Select></Field>
    <Field label="Competência"><Input type="date" {...form.register("competence")} /></Field>
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...form.register("amount_locked")} /> Manter valor previsto</label>
    <Button disabled={update.isPending || categories.isPending || accounts.isPending} type="submit">{update.isPending ? "Salvando…" : "Salvar"}</Button>
  </form>;
}

function CompleteTransactionForm({ transaction, onClose }: Readonly<{ transaction: Transaction; onClose: () => void }>) {
  const complete = useCompleteTransaction();
  const form = useForm<CompleteValues>({
    resolver: zodResolver(transactionCompleteSchema),
    defaultValues: { amount: transaction.estimated_amount, effective_date: today() },
  });
  return <form className="space-y-4" onSubmit={form.handleSubmit((body) => complete.mutate({ id: transaction.id, body }, { onSuccess: onClose }))}>
    <Field label="Valor realizado" error={form.formState.errors.amount?.message}><Input inputMode="decimal" type="text" {...form.register("amount")} /></Field>
    <Field label="Data efetiva" error={form.formState.errors.effective_date?.message}><Input type="date" {...form.register("effective_date")} /></Field>
    <Button disabled={complete.isPending} type="submit">{complete.isPending ? "Concluindo…" : "Concluir"}</Button>
  </form>;
}

export function TransactionRowActions({ transaction }: Readonly<{ transaction: Transaction }>) {
  const [dialog, setDialog] = useState<"edit" | "complete" | null>(null);
  const [confirm, setConfirm] = useState<"cancel" | "delete" | null>(null);
  const update = useUpdateTransaction();
  const remove = useDeleteTransaction();
  return <>
    <div className="flex flex-wrap gap-2">
      <SecondaryButton onClick={() => setDialog("edit")} type="button">Editar</SecondaryButton>
      {transaction.status === "PENDING" && transaction.invoice_id === null && <SecondaryButton onClick={() => setDialog("complete")} type="button">Concluir</SecondaryButton>}
      {transaction.status !== "CANCELLED" && <SecondaryButton onClick={() => setConfirm("cancel")} type="button">Cancelar</SecondaryButton>}
      <SecondaryButton onClick={() => setConfirm("delete")} type="button">Excluir</SecondaryButton>
    </div>
    <Dialog open={dialog !== null} onClose={() => setDialog(null)} title={dialog === "edit" ? "Editar transação" : "Concluir transação"}>
      {dialog === "edit" && <EditTransactionForm transaction={transaction} onClose={() => setDialog(null)} />}
      {dialog === "complete" && <CompleteTransactionForm transaction={transaction} onClose={() => setDialog(null)} />}
    </Dialog>
    <ConfirmDialog
      open={confirm !== null}
      title={confirm === "cancel" ? "Cancelar transação?" : "Excluir transação?"}
      description={confirm === "cancel"
        ? "A transação será mantida no histórico com o status Cancelada."
        : "A transação será removida e não aparecerá mais na sua lista."}
      confirmLabel={confirm === "cancel" ? "Cancelar transação" : "Excluir transação"}
      pending={update.isPending || remove.isPending}
      onClose={() => setConfirm(null)}
      onConfirm={() => {
      if (confirm === "cancel") update.mutate({ id: transaction.id, body: { status: "CANCELLED" } }, { onSuccess: () => setConfirm(null) });
      if (confirm === "delete") remove.mutate(transaction.id, { onSuccess: () => setConfirm(null) });
      }}
    />
  </>;
}

export function CompleteTransactionAction({ transaction }: Readonly<{ transaction: Transaction }>) {
  const [open, setOpen] = useState(false);
  if (transaction.status !== "PENDING" || transaction.invoice_id !== null) return null;
  return <>
    <SecondaryButton onClick={() => setOpen(true)} type="button">Concluir</SecondaryButton>
    <Dialog open={open} onClose={() => setOpen(false)} title="Concluir transação">
      <CompleteTransactionForm transaction={transaction} onClose={() => setOpen(false)} />
    </Dialog>
  </>;
}

export function TransactionsFilters({
  filters,
  onChange,
}: Readonly<{ filters: TransactionFilters; onChange: (filters: TransactionFilters) => void }>) {
  return <div className="mb-4 grid gap-3 rounded-xl border bg-white p-4 sm:grid-cols-[1fr_1fr_auto]">
    <label className="text-sm font-medium">Mês<Input type="month" value={filters.month} onChange={(event) => onChange({ ...filters, month: event.target.value, page: 1 })} /></label>
    <label className="text-sm font-medium">Status<Select value={filters.status ?? ""} onChange={(event) => onChange({ ...filters, status: (event.target.value || undefined) as TransactionFilters["status"], page: 1 })}><option value="">Todos</option><option value="PENDING">Pendente</option><option value="COMPLETED">Concluída</option><option value="CANCELLED">Cancelada</option></Select></label>
    <p className="self-end pb-2 text-sm text-slate-600">Página {filters.page}</p>
  </div>;
}

export function TransactionsTable({ initialMonth }: Readonly<{ initialMonth: string }>) {
  const [filters, setFilters] = useState<TransactionFilters>({ month: initialMonth, page: 1, per_page: 20 });
  const result = useTransactionsQuery(filters);
  const accounts = useAccountsQuery();
  const categories = useCategoriesQuery();
  if (result.isPending || accounts.isPending || categories.isPending) return <div className="space-y-3"><div className="h-20 animate-pulse rounded-lg bg-slate-200" /><div className="h-48 animate-pulse rounded-lg bg-slate-200" /></div>;
  if (result.error || accounts.error || categories.error) return <p role="alert" className="text-red-700">{result.error?.message ?? accounts.error?.message ?? categories.error?.message}</p>;
  const accountNames = new Map(accounts.data.map((account) => [account.id, account.name]));
  const categoryNames = new Map(categories.data.map((category) => [category.id, category.name]));
  const items = result.data;
  return <>
    <TransactionsFilters filters={filters} onChange={setFilters} />
    {items.length === 0 ? <EmptyState message="Nenhuma transação encontrada para estes filtros." action={<Link className="underline" href="/transactions/new">Criar transação</Link>} /> : <>
      <div className="hidden overflow-x-auto rounded-lg border bg-white md:block"><table className="w-full text-left text-sm"><thead className="bg-slate-100"><tr><th className="p-3">Vencimento</th><th className="p-3">Descrição</th><th className="p-3">Tipo</th><th className="p-3">Conta / categoria</th><th className="p-3">Previsto</th><th className="p-3">Valor final</th><th className="p-3">Status</th><th className="p-3">Ações</th></tr></thead><tbody className="divide-y">{items.map((item) => <tr key={item.id}><td className="p-3">{formatDateBR(item.due_date)}</td><td className="p-3 font-medium"><Link className="hover:underline" href={`/transactions/${item.id}`}>{item.description}</Link></td><td className="p-3"><Badge variant={item.direction === "EXPENSE" ? "destructive" : "secondary"}>{directionName[item.direction]}</Badge></td><td className="p-3">{item.account_id ? accountNames.get(item.account_id) ?? "—" : "—"}<span className="block text-xs text-slate-500">{item.category_id ? categoryNames.get(item.category_id) ?? "—" : "Sem categoria"}</span></td><td className="p-3">{formatBRL(item.estimated_amount)}</td><td className="p-3">{item.amount ? formatBRL(item.amount) : "—"}</td><td className="p-3"><Badge variant={item.status === "CANCELLED" ? "destructive" : "outline"}>{statusName[item.status]}</Badge></td><td className="p-3"><TransactionRowActions transaction={item} /></td></tr>)}</tbody></table></div>
      <div className="space-y-3 md:hidden">{items.map((item) => <article className="rounded-lg border bg-white p-4" key={item.id}><p className="flex flex-wrap gap-2 text-sm"><span>{formatDateBR(item.due_date)}</span><Badge variant={item.direction === "EXPENSE" ? "destructive" : "secondary"}>{directionName[item.direction]}</Badge><Badge variant={item.status === "CANCELLED" ? "destructive" : "outline"}>{statusName[item.status]}</Badge></p><Link className="mt-1 block font-semibold" href={`/transactions/${item.id}`}>{item.description}</Link><p className="mt-2 text-sm">{item.account_id ? accountNames.get(item.account_id) ?? "—" : "—"} · {item.category_id ? categoryNames.get(item.category_id) ?? "—" : "Sem categoria"}</p><p className="mt-1 text-sm">{formatBRL(item.estimated_amount)} · {item.amount ? formatBRL(item.amount) : "—"}</p><div className="mt-3"><TransactionRowActions transaction={item} /></div></article>)}</div>
    </>}
    <div className="mt-4 flex justify-end gap-2"><SecondaryButton disabled={filters.page <= 1} onClick={() => setFilters({ ...filters, page: filters.page - 1 })} type="button">Anterior</SecondaryButton><SecondaryButton disabled={items.length < filters.per_page} onClick={() => setFilters({ ...filters, page: filters.page + 1 })} type="button">Próxima</SecondaryButton></div>
  </>;
}
