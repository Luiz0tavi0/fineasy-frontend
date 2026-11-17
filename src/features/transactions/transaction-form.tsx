"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button, Field, Input, Select } from "@/components/ui";
import { transactionSchema } from "./schemas";
import { useCreateTransaction } from "./mutations";
import type { Account } from "@/features/accounts/types";
import type { Category } from "@/features/categories/types";
import type { z } from "zod";

type Values = z.infer<typeof transactionSchema>;

export function TransactionForm({ accounts, categories, currentDate }: Readonly<{ accounts: Account[]; categories: Category[]; currentDate: string }>) {
  const router = useRouter();
  const create = useCreateTransaction();
  const form = useForm<z.input<typeof transactionSchema>, undefined, Values>({
    resolver: zodResolver(transactionSchema),
    defaultValues: { account_id: 0, category_id: "", description: "", direction: "EXPENSE", estimated_amount: "", due_date: currentDate, competence: "", amount_locked: false },
  });
  const submit = (values: Values) => create.mutate({ ...values, status: "PENDING" }, { onSuccess: () => router.push("/transactions") });
  return <form className="max-w-2xl space-y-4 rounded-xl border bg-white p-5" onSubmit={form.handleSubmit(submit)}>
    <Field label="Conta" error={form.formState.errors.account_id?.message}><Select {...form.register("account_id")}><option value="0">Selecione</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</Select></Field>
    <Field label="Categoria (opcional)" error={form.formState.errors.category_id?.message}><Select {...form.register("category_id")}><option value="">Sem categoria</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</Select></Field>
    <Field label="Descrição" error={form.formState.errors.description?.message}><Input maxLength={255} {...form.register("description")} /></Field>
    <Field label="Tipo"><Select {...form.register("direction")}><option value="EXPENSE">Despesa</option><option value="INCOME">Receita</option></Select></Field>
    <Field label="Valor previsto" error={form.formState.errors.estimated_amount?.message}><Input inputMode="decimal" type="text" {...form.register("estimated_amount")} /></Field>
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Vencimento" error={form.formState.errors.due_date?.message}><Input type="date" {...form.register("due_date")} /></Field>
      <Field label="Competência (opcional)" error={form.formState.errors.competence?.message}><Input type="date" {...form.register("competence")} /></Field>
    </div>
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...form.register("amount_locked")} /> Manter valor previsto</label>
    <Button disabled={create.isPending} type="submit">{create.isPending ? "Salvando…" : "Criar transação"}</Button>
  </form>;
}
