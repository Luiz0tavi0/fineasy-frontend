"use client";

import Link from "next/link";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button, ConfirmDialog, Dialog, EmptyState, Field, Input, Select, SecondaryButton } from "@/components/ui";
import { formatBRL } from "@/lib/money";
import { useAccountsQuery } from "@/features/accounts";
import { useCategoriesQuery } from "@/features/categories";
import { recurrenceEditSchema } from "./schemas";
import { useRecurrencesQuery } from "./queries";
import { useDeleteRecurrence, useUpdateRecurrence } from "./mutations";
import type { Recurrence } from "./types";
import type { z } from "zod";

type Values = z.infer<typeof recurrenceEditSchema>;

function EditRecurrenceForm({ recurrence, onClose }: Readonly<{ recurrence: Recurrence; onClose: () => void }>) {
  const categories = useCategoriesQuery();
  const update = useUpdateRecurrence();
  const form = useForm<z.input<typeof recurrenceEditSchema>, undefined, Values>({
    resolver: zodResolver(recurrenceEditSchema),
    defaultValues: { description: recurrence.description, estimated_amount: recurrence.estimated_amount, category_id: recurrence.category_id ?? "" },
  });
  return <form className="space-y-4" onSubmit={form.handleSubmit((body) => update.mutate({ id: recurrence.id, body }, { onSuccess: onClose }))}>
    <Field label="Descrição" error={form.formState.errors.description?.message}><Input {...form.register("description")} /></Field>
    <Field label="Valor estimado" error={form.formState.errors.estimated_amount?.message}><Input inputMode="decimal" type="text" {...form.register("estimated_amount")} /></Field>
    <Field label="Categoria"><Select {...form.register("category_id")}><option value="">Sem categoria</option>{(categories.data ?? []).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</Select></Field>
    <Button disabled={update.isPending} type="submit">{update.isPending ? "Salvando…" : "Salvar"}</Button>
  </form>;
}

export function RecurrencesTable() {
  const result = useRecurrencesQuery();
  const accounts = useAccountsQuery();
  const categories = useCategoriesQuery();
  const [editing, setEditing] = useState<Recurrence>();
  const [deleting, setDeleting] = useState<Recurrence>();
  const remove = useDeleteRecurrence();
  if (result.isPending || accounts.isPending || categories.isPending) return <div className="h-48 animate-pulse rounded-lg bg-slate-200" />;
  if (result.error || accounts.error || categories.error) return <p role="alert" className="text-red-700">{result.error?.message ?? accounts.error?.message ?? categories.error?.message}</p>;
  if (!result.data.length) return <EmptyState message="Você ainda não cadastrou recorrências." action={<a className="underline" href="#new-recurrence">Criar recorrência</a>} />;
  const accountNames = new Map(accounts.data.map((item) => [item.id, item.name]));
  const categoryNames = new Map(categories.data.map((item) => [item.id, item.name]));
  return <>
    <div className="hidden overflow-x-auto rounded-lg border bg-white md:block"><table className="w-full text-left text-sm"><thead className="bg-slate-100"><tr><th className="p-3">Descrição</th><th className="p-3">Dia</th><th className="p-3">Valor</th><th className="p-3">Variável</th><th className="p-3">Conta</th><th className="p-3">Categoria</th><th className="p-3">Ações</th></tr></thead><tbody className="divide-y">{result.data.map((item) => <tr key={item.id}><td className="p-3 font-medium"><Link className="hover:underline" href={`/recurrences/${item.id}`}>{item.description}</Link></td><td className="p-3">{item.anchor_day}</td><td className="p-3">{formatBRL(item.estimated_amount)}</td><td className="p-3">{item.variable_amount ? "Sim" : "Não"}</td><td className="p-3">{item.account_id ? accountNames.get(item.account_id) ?? "—" : "—"}</td><td className="p-3">{item.category_id ? categoryNames.get(item.category_id) ?? "—" : "—"}</td><td className="p-3"><div className="flex gap-2"><SecondaryButton onClick={() => setEditing(item)} type="button">Editar</SecondaryButton><SecondaryButton onClick={() => setDeleting(item)} type="button">Excluir</SecondaryButton></div></td></tr>)}</tbody></table></div>
    <div className="space-y-3 md:hidden">{result.data.map((item) => <article className="rounded-lg border bg-white p-4" key={item.id}><Link className="font-semibold" href={`/recurrences/${item.id}`}>{item.description}</Link><p className="mt-1 text-sm text-slate-600">Dia {item.anchor_day} · {formatBRL(item.estimated_amount)} · {item.variable_amount ? "Variável" : "Fixo"}</p><p className="text-sm">{item.account_id ? accountNames.get(item.account_id) ?? "—" : "—"} · {item.category_id ? categoryNames.get(item.category_id) ?? "—" : "Sem categoria"}</p><div className="mt-3 flex gap-2"><SecondaryButton onClick={() => setEditing(item)} type="button">Editar</SecondaryButton><SecondaryButton onClick={() => setDeleting(item)} type="button">Excluir</SecondaryButton></div></article>)}</div>
    <Dialog open={Boolean(editing)} onClose={() => setEditing(undefined)} title="Editar recorrência">{editing && <EditRecurrenceForm recurrence={editing} onClose={() => setEditing(undefined)} />}</Dialog>
    <ConfirmDialog open={Boolean(deleting)} pending={remove.isPending} onClose={() => setDeleting(undefined)} onConfirm={() => { if (!deleting) return; remove.mutate(deleting.id, { onSuccess: () => setDeleting(undefined) }); }} />
  </>;
}
