"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { formatBRL } from "@/lib/money";
import { Button, ConfirmDialog, Dialog, EmptyState, Field, Input, Select, SecondaryButton } from "@/components/ui";
import { accountSchema } from "./schemas";
import { useAccountsQuery } from "./queries";
import { useCreateAccount, useDeleteAccount, useUpdateAccount } from "./mutations";
import type { Account, AccountType } from "./types";
import type { z } from "zod";

type AccountValues = z.infer<typeof accountSchema>;

const accountLabels: Record<AccountType, string> = { CASH: "Dinheiro", BANK: "Banco", WALLET: "Carteira" };

function AccountForm({ account, onClose }: Readonly<{ account?: Account; onClose: () => void }>) {
  const create = useCreateAccount();
  const update = useUpdateAccount();
  const form = useForm<AccountValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: account?.name ?? "",
      account_type: account?.account_type ?? "BANK",
      initial_balance: account?.initial_balance ?? "0.00",
    },
  });
  const pending = create.isPending || update.isPending;
  function submit(values: AccountValues) {
    if (account) update.mutate({ id: account.id, body: values }, { onSuccess: onClose });
    else create.mutate(values, { onSuccess: onClose });
  }
  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(submit)}>
      <Field label="Nome" error={form.formState.errors.name?.message}><Input {...form.register("name")} /></Field>
      <Field label="Tipo" error={form.formState.errors.account_type?.message}>
        <Select {...form.register("account_type")}>
          <option value="CASH">Dinheiro</option><option value="BANK">Banco</option><option value="WALLET">Carteira</option>
        </Select>
      </Field>
      <Field label="Saldo inicial" error={form.formState.errors.initial_balance?.message}>
        <Input inputMode="decimal" type="text" {...form.register("initial_balance")} />
      </Field>
      <div className="flex justify-end gap-2">
        <SecondaryButton onClick={onClose} type="button">Cancelar</SecondaryButton>
        <Button disabled={pending} type="submit">{pending ? "Salvando…" : "Salvar"}</Button>
      </div>
    </form>
  );
}

export function CreateAccountDialog() {
  const [open, setOpen] = useState(false);
  return <>
    <Button onClick={() => setOpen(true)} type="button">Nova conta</Button>
    <Dialog open={open} onClose={() => setOpen(false)} title="Nova conta">
      <AccountForm onClose={() => setOpen(false)} />
    </Dialog>
  </>;
}

export function AccountsTable() {
  const { data = [], isPending, error } = useAccountsQuery();
  const [editing, setEditing] = useState<Account>();
  const [deleting, setDeleting] = useState<Account>();
  const remove = useDeleteAccount();
  if (isPending) return <div className="h-48 animate-pulse rounded-lg bg-slate-200" />;
  if (error) return <p role="alert" className="text-red-700">{error.message}</p>;
  if (data.length === 0) return <EmptyState message="Você ainda não cadastrou contas." action={<CreateAccountDialog />} />;
  return <>
    <div className="hidden overflow-x-auto rounded-lg border bg-white md:block">
      <table className="w-full text-left text-sm"><thead className="bg-slate-100"><tr><th className="p-3">Nome</th><th className="p-3">Tipo</th><th className="p-3">Saldo atual</th><th className="p-3">Ações</th></tr></thead>
        <tbody className="divide-y">{data.map((account) => <tr key={account.id}><td className="p-3 font-medium">{account.name}</td><td className="p-3">{accountLabels[account.account_type]}</td><td className="p-3">{formatBRL(account.current_balance)}</td><td className="p-3"><div className="flex gap-2"><SecondaryButton onClick={() => setEditing(account)} type="button">Editar</SecondaryButton><SecondaryButton onClick={() => setDeleting(account)} type="button">Excluir</SecondaryButton></div></td></tr>)}</tbody>
      </table>
    </div>
    <div className="space-y-3 md:hidden">{data.map((account) => <article className="rounded-lg border bg-white p-4" key={account.id}><h2 className="font-semibold">{account.name}</h2><p className="mt-1 text-sm text-slate-600">{accountLabels[account.account_type]} · {formatBRL(account.current_balance)}</p><div className="mt-3 flex gap-2"><SecondaryButton onClick={() => setEditing(account)} type="button">Editar</SecondaryButton><SecondaryButton onClick={() => setDeleting(account)} type="button">Excluir</SecondaryButton></div></article>)}</div>
    <Dialog open={Boolean(editing)} onClose={() => setEditing(undefined)} title="Editar conta">{editing && <AccountForm account={editing} onClose={() => setEditing(undefined)} />}</Dialog>
    <ConfirmDialog open={Boolean(deleting)} pending={remove.isPending} onClose={() => setDeleting(undefined)} onConfirm={() => { if (!deleting) return; remove.mutate(deleting.id, { onSuccess: () => setDeleting(undefined) }); }} />
  </>;
}
