"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { formatDateTimeBR } from "@/lib/dates";
import { Button, ConfirmDialog, Dialog, EmptyState, Field, Input, SecondaryButton } from "@/components/ui";
import { categorySchema } from "./schemas";
import { useCategoriesQuery } from "./queries";
import { useCreateCategory, useDeleteCategory, useUpdateCategory } from "./mutations";
import type { Category } from "./types";
import type { z } from "zod";

type Values = z.infer<typeof categorySchema>;

function CategoryForm({ category, onClose }: Readonly<{ category?: Category; onClose: () => void }>) {
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const form = useForm<Values>({ resolver: zodResolver(categorySchema), defaultValues: { name: category?.name ?? "" } });
  function submit(values: Values) {
    if (category) update.mutate({ id: category.id, body: values }, { onSuccess: onClose });
    else create.mutate(values, { onSuccess: onClose });
  }
  const pending = create.isPending || update.isPending;
  return <form className="space-y-4" onSubmit={form.handleSubmit(submit)}>
    <Field label="Nome" error={form.formState.errors.name?.message}><Input {...form.register("name")} /></Field>
    <div className="flex justify-end gap-2"><SecondaryButton onClick={onClose} type="button">Cancelar</SecondaryButton><Button disabled={pending} type="submit">{pending ? "Salvando…" : "Salvar"}</Button></div>
  </form>;
}

export function CreateCategoryDialog() {
  const [open, setOpen] = useState(false);
  return <>
    <Button onClick={() => setOpen(true)} type="button">Nova categoria</Button>
    <Dialog open={open} onClose={() => setOpen(false)} title="Nova categoria"><CategoryForm onClose={() => setOpen(false)} /></Dialog>
  </>;
}

export function CategoriesTable() {
  const { data = [], isPending, error } = useCategoriesQuery();
  const [editing, setEditing] = useState<Category>();
  const [deleting, setDeleting] = useState<Category>();
  const remove = useDeleteCategory();
  if (isPending) return <div className="h-48 animate-pulse rounded-lg bg-slate-200" />;
  if (error) return <p role="alert" className="text-red-700">{error.message}</p>;
  if (!data.length) return <EmptyState message="Você ainda não cadastrou categorias." action={<CreateCategoryDialog />} />;
  return <>
    <div className="hidden overflow-x-auto rounded-lg border bg-white md:block"><table className="w-full text-left text-sm"><thead className="bg-slate-100"><tr><th className="p-3">Nome</th><th className="p-3">Criada em</th><th className="p-3">Ações</th></tr></thead><tbody className="divide-y">{data.map((category) => <tr key={category.id}><td className="p-3 font-medium">{category.name}</td><td className="p-3">{formatDateTimeBR(category.created_at)}</td><td className="p-3"><div className="flex gap-2"><SecondaryButton onClick={() => setEditing(category)} type="button">Editar</SecondaryButton><SecondaryButton onClick={() => setDeleting(category)} type="button">Excluir</SecondaryButton></div></td></tr>)}</tbody></table></div>
    <div className="space-y-3 md:hidden">{data.map((category) => <article className="rounded-lg border bg-white p-4" key={category.id}><h2 className="font-semibold">{category.name}</h2><p className="mt-1 text-sm text-slate-600">Criada em {formatDateTimeBR(category.created_at)}</p><div className="mt-3 flex gap-2"><SecondaryButton onClick={() => setEditing(category)} type="button">Editar</SecondaryButton><SecondaryButton onClick={() => setDeleting(category)} type="button">Excluir</SecondaryButton></div></article>)}</div>
    <Dialog open={Boolean(editing)} onClose={() => setEditing(undefined)} title="Editar categoria"><CategoryForm category={editing} onClose={() => setEditing(undefined)} /></Dialog>
    <ConfirmDialog open={Boolean(deleting)} pending={remove.isPending} onClose={() => setDeleting(undefined)} onConfirm={() => { if (!deleting) return; remove.mutate(deleting.id, { onSuccess: () => setDeleting(undefined) }); }} />
  </>;
}
