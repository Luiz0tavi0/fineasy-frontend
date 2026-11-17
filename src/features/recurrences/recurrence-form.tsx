"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button, Field, Input, Select, SecondaryButton } from "@/components/ui";
import { formatBRL } from "@/lib/money";
import { formatDateBR } from "@/lib/dates";
import { recurrenceSchema } from "./schemas";
import { useConfirmRecurrence, useSimulateRecurrence } from "./mutations";
import type { Account } from "@/features/accounts/types";
import type { Category } from "@/features/categories/types";
import type { RecurrenceCreate, RecurrencePreview } from "./types";
import type { z } from "zod";

type Values = z.infer<typeof recurrenceSchema>;

export function RecurrenceForm({ accounts, categories, currentDate }: Readonly<{ accounts: Account[]; categories: Category[]; currentDate: string }>) {
  const [submitted, setSubmitted] = useState<RecurrenceCreate>();
  const [preview, setPreview] = useState<RecurrencePreview>();
  const simulate = useSimulateRecurrence();
  const confirm = useConfirmRecurrence();
  const form = useForm<z.input<typeof recurrenceSchema>, undefined, Values>({
    resolver: zodResolver(recurrenceSchema),
    defaultValues: { description: "", account_id: 0, category_id: "", anchor_day: 1, start_month: `${currentDate.slice(0, 7)}-01`, count: 12, variable_amount: false, estimated_amount: "", direction: "EXPENSE" },
  });
  const onSimulate = (values: Values) => { setSubmitted(values); simulate.mutate(values, { onSuccess: setPreview }); };
  function onConfirm() {
    if (!submitted || !preview) return;
    confirm.mutate({
      ...submitted,
      occurrences: preview.occurrences.map(({ due_date, estimated_amount }) => ({ due_date, estimated_amount })),
    }, { onSuccess: () => { setPreview(undefined); setSubmitted(undefined); form.reset(); } });
  }
  return <div className="space-y-6">
    <form className="max-w-2xl space-y-4 rounded-xl border bg-white p-5" onSubmit={form.handleSubmit(onSimulate)}>
      <fieldset className="space-y-4" disabled={Boolean(preview) || simulate.isPending}>
      <Field label="Descrição" error={form.formState.errors.description?.message}><Input {...form.register("description")} /></Field>
      <Field label="Conta" error={form.formState.errors.account_id?.message}><Select {...form.register("account_id")}><option value="0">Selecione</option>{accounts.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field>
      <Field label="Categoria (opcional)"><Select {...form.register("category_id")}><option value="">Sem categoria</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Dia de referência" error={form.formState.errors.anchor_day?.message}><Input max="31" min="1" type="number" {...form.register("anchor_day")} /></Field>
        <Field label="Mês inicial" error={form.formState.errors.start_month?.message}><Input type="date" {...form.register("start_month")} /></Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Quantidade" error={form.formState.errors.count?.message}><Input max="36" min="1" type="number" {...form.register("count")} /></Field>
        <Field label="Valor estimado" error={form.formState.errors.estimated_amount?.message}><Input inputMode="decimal" type="text" {...form.register("estimated_amount")} /></Field>
      </div>
      <Field label="Direção"><Select {...form.register("direction")}><option value="EXPENSE">Despesa</option><option value="INCOME">Receita</option></Select></Field>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...form.register("variable_amount")} /> Valor variável</label>
      <Button disabled={simulate.isPending || Boolean(preview)} type="submit">{simulate.isPending ? "Simulando…" : "Simular ocorrências"}</Button>
      </fieldset>
    </form>
    {preview && <section className="rounded-xl border bg-white p-5"><h2 className="mb-4 text-lg font-semibold">Prévia das ocorrências</h2><div className="space-y-2">{preview.occurrences.map((item) => <div className="flex justify-between border-b py-2 text-sm" key={item.occurrence_number}><span>Ocorrência {item.occurrence_number}</span><span>{formatDateBR(item.due_date)} · {formatBRL(item.estimated_amount)}</span></div>)}</div><div className="mt-4 flex flex-wrap gap-2"><Button disabled={confirm.isPending} onClick={onConfirm} type="button">{confirm.isPending ? "Confirmando…" : "Confirmar recorrência"}</Button><SecondaryButton disabled={confirm.isPending} onClick={() => { setPreview(undefined); setSubmitted(undefined); }} type="button">Editar dados</SecondaryButton></div></section>}
  </div>;
}
