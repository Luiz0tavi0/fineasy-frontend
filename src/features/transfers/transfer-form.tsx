"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Field, Input, Select } from "@/components/ui";
import { transferSchema } from "./schemas";
import { useCreateTransfer } from "./mutations";
import type { Account } from "@/features/accounts/types";
import type { z } from "zod";

type Values = z.infer<typeof transferSchema>;

export function TransferForm({ accounts, currentDate, onSuccess }: Readonly<{ accounts: Account[]; currentDate: string; onSuccess: () => void }>) {
  const create = useCreateTransfer();
  const form = useForm<z.input<typeof transferSchema>, undefined, Values>({
    resolver: zodResolver(transferSchema),
    defaultValues: { from_account_id: 0, to_account_id: 0, amount: "", description: "", date: currentDate },
  });
  return <form className="space-y-4" onSubmit={form.handleSubmit((body) => create.mutate(body, { onSuccess }))}>
    <Field label="Conta de origem" error={form.formState.errors.from_account_id?.message}><Select {...form.register("from_account_id")}><option value="0">Selecione</option>{accounts.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field>
    <Field label="Conta de destino" error={form.formState.errors.to_account_id?.message}><Select {...form.register("to_account_id")}><option value="0">Selecione</option>{accounts.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field>
    <Field label="Valor" error={form.formState.errors.amount?.message}><Input inputMode="decimal" type="text" {...form.register("amount")} /></Field>
    <Field label="Descrição (opcional)" error={form.formState.errors.description?.message}><Input maxLength={255} {...form.register("description")} /></Field>
    <Field label="Data" error={form.formState.errors.date?.message}><Input type="date" {...form.register("date")} /></Field>
    <Button disabled={create.isPending} type="submit">{create.isPending ? "Salvando…" : "Criar transferência"}</Button>
  </form>;
}
