"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button, ConfirmDialog, Dialog, EmptyState, Field, Input, Select, SecondaryButton } from "@/components/ui";
import { useAccountsQuery } from "@/features/accounts";
import { creditCardSchema } from "./schemas";
import { useCreditCardsQuery } from "./queries";
import { useCreateCreditCard, useDeleteCreditCard, useUpdateCreditCard } from "./mutations";
import type { CreditCard } from "./types";
import type { z } from "zod";

type Values = z.output<typeof creditCardSchema>;

function CreditCardForm({ card, onClose }: Readonly<{ card?: CreditCard; onClose: () => void }>) {
  const accounts = useAccountsQuery();
  const create = useCreateCreditCard();
  const update = useUpdateCreditCard();
  const form = useForm<z.input<typeof creditCardSchema>, undefined, Values>({
    resolver: zodResolver(creditCardSchema),
    defaultValues: {
      name: card?.name ?? "",
      closing_day: card?.closing_day ?? 1,
      due_day: card?.due_day ?? 10,
      suggested_payment_account_id: card?.suggested_payment_account_id ?? "",
    },
  });
  function submit(values: Values) {
    if (card) update.mutate({ id: card.id, body: values }, { onSuccess: onClose });
    else create.mutate(values, { onSuccess: onClose });
  }
  const pending = create.isPending || update.isPending;
  return <form className="space-y-4" onSubmit={form.handleSubmit(submit)}>
    <Field label="Nome" error={form.formState.errors.name?.message}><Input {...form.register("name")} /></Field>
    <div className="grid grid-cols-2 gap-3">
      <Field label="Dia de fechamento" error={form.formState.errors.closing_day?.message}><Input max="31" min="1" type="number" {...form.register("closing_day")} /></Field>
      <Field label="Dia de vencimento" error={form.formState.errors.due_day?.message}><Input max="31" min="1" type="number" {...form.register("due_day")} /></Field>
    </div>
    <Field label="Conta sugerida para pagamento">
      <Select {...form.register("suggested_payment_account_id")}><option value="">Nenhuma</option>{(accounts.data ?? []).map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</Select>
    </Field>
    {accounts.error && <p className="text-sm text-red-700">{accounts.error.message}</p>}
    <div className="flex justify-end gap-2"><SecondaryButton onClick={onClose} type="button">Cancelar</SecondaryButton><Button disabled={pending || accounts.isPending} type="submit">{pending ? "Salvando…" : "Salvar"}</Button></div>
  </form>;
}

export function CreateCreditCardDialog() {
  const [open, setOpen] = useState(false);
  return <>
    <Button onClick={() => setOpen(true)} type="button">Novo cartão</Button>
    <Dialog open={open} onClose={() => setOpen(false)} title="Novo cartão"><CreditCardForm onClose={() => setOpen(false)} /></Dialog>
  </>;
}

export function CreditCardsTable() {
  const cards = useCreditCardsQuery();
  const accounts = useAccountsQuery();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CreditCard>();
  const [deleting, setDeleting] = useState<CreditCard>();
  const remove = useDeleteCreditCard();
  if (cards.isPending || accounts.isPending) return <div className="h-48 animate-pulse rounded-lg bg-slate-200" />;
  if (cards.error || accounts.error) return <p role="alert" className="text-red-700">{cards.error?.message ?? accounts.error?.message}</p>;
  const accountNames = new Map(accounts.data.map((account) => [account.id, account.name]));
  return <>
    {!cards.data.length ? <EmptyState message="Você ainda não cadastrou cartões." action={<Button onClick={() => setDialogOpen(true)} type="button">Novo cartão</Button>} /> : <>
      <div className="hidden overflow-x-auto rounded-lg border bg-white md:block"><table className="w-full text-left text-sm"><thead className="bg-slate-100"><tr><th className="p-3">Nome</th><th className="p-3">Fechamento</th><th className="p-3">Vencimento</th><th className="p-3">Conta sugerida</th><th className="p-3">Ações</th></tr></thead><tbody className="divide-y">{cards.data.map((card) => <tr key={card.id}><td className="p-3 font-medium">{card.name}</td><td className="p-3">Dia {card.closing_day}</td><td className="p-3">Dia {card.due_day}</td><td className="p-3">{card.suggested_payment_account_id ? accountNames.get(card.suggested_payment_account_id) ?? "Conta não encontrada" : "—"}</td><td className="p-3"><div className="flex gap-2"><SecondaryButton onClick={() => setEditing(card)} type="button">Editar</SecondaryButton><SecondaryButton onClick={() => setDeleting(card)} type="button">Excluir</SecondaryButton></div></td></tr>)}</tbody></table></div>
      <div className="space-y-3 md:hidden">{cards.data.map((card) => <article className="rounded-lg border bg-white p-4" key={card.id}><h2 className="font-semibold">{card.name}</h2><p className="mt-1 text-sm text-slate-600">Fecha dia {card.closing_day} · vence dia {card.due_day} · {card.suggested_payment_account_id ? accountNames.get(card.suggested_payment_account_id) ?? "Conta não encontrada" : "Sem conta sugerida"}</p><div className="mt-3 flex gap-2"><SecondaryButton onClick={() => setEditing(card)} type="button">Editar</SecondaryButton><SecondaryButton onClick={() => setDeleting(card)} type="button">Excluir</SecondaryButton></div></article>)}</div>
    </>}
    <Dialog open={dialogOpen || Boolean(editing)} onClose={() => { setDialogOpen(false); setEditing(undefined); }} title={editing ? "Editar cartão" : "Novo cartão"}><CreditCardForm card={editing} onClose={() => { setDialogOpen(false); setEditing(undefined); }} /></Dialog>
    <ConfirmDialog open={Boolean(deleting)} pending={remove.isPending} onClose={() => setDeleting(undefined)} onConfirm={() => { if (!deleting) return; remove.mutate(deleting.id, { onSuccess: () => setDeleting(undefined) }); }} />
  </>;
}
