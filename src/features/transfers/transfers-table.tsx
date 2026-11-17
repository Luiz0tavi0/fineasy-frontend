"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, Dialog, EmptyState } from "@/components/ui";
import { formatBRL } from "@/lib/money";
import { formatDateBR } from "@/lib/dates";
import { useAccountsQuery } from "@/features/accounts";
import { TransferForm } from "./transfer-form";
import { useTransfersQuery } from "./queries";

export function CreateTransferDialog({ currentDate }: Readonly<{ currentDate: string }>) {
  const accounts = useAccountsQuery();
  const [open, setOpen] = useState(false);
  return <>
    <Button onClick={() => setOpen(true)} type="button">Nova transferência</Button>
    <Dialog open={open} onClose={() => setOpen(false)} title="Nova transferência">
      {accounts.isPending ? <div className="h-48 animate-pulse rounded bg-slate-200" /> : accounts.error ? <p role="alert" className="text-red-700">{accounts.error.message}</p> : <TransferForm accounts={accounts.data} currentDate={currentDate} onSuccess={() => setOpen(false)} />}
    </Dialog>
  </>;
}

export function TransfersTable({ currentDate }: Readonly<{ currentDate: string }>) {
  const transfers = useTransfersQuery();
  const accounts = useAccountsQuery();
  if (transfers.isPending || accounts.isPending) return <div className="h-48 animate-pulse rounded-lg bg-slate-200" />;
  if (transfers.error || accounts.error) return <p role="alert" className="text-red-700">{transfers.error?.message ?? accounts.error?.message}</p>;
  if (!transfers.data.length) return <EmptyState message="Você ainda não registrou transferências." action={<CreateTransferDialog currentDate={currentDate} />} />;
  const names = new Map(accounts.data.map((item) => [item.id, item.name]));
  return <>
    <div className="hidden overflow-x-auto rounded-lg border bg-white md:block"><table className="w-full text-left text-sm"><thead className="bg-slate-100"><tr><th className="p-3">Data</th><th className="p-3">Origem</th><th className="p-3">Destino</th><th className="p-3">Valor</th><th className="p-3">Descrição</th></tr></thead><tbody className="divide-y">{transfers.data.map((item) => <tr key={item.id}><td className="p-3"><Link className="hover:underline" href={`/transfers/${item.id}`}>{formatDateBR(item.date)}</Link></td><td className="p-3">{names.get(item.from_account_id) ?? "—"}</td><td className="p-3">{names.get(item.to_account_id) ?? "—"}</td><td className="p-3">{formatBRL(item.amount)}</td><td className="p-3">{item.description ?? "—"}</td></tr>)}</tbody></table></div>
    <div className="space-y-3 md:hidden">{transfers.data.map((item) => <article className="rounded-lg border bg-white p-4" key={item.id}><Link className="font-semibold" href={`/transfers/${item.id}`}>{formatDateBR(item.date)} · {formatBRL(item.amount)}</Link><p className="mt-1 text-sm text-slate-600">{names.get(item.from_account_id) ?? "—"} → {names.get(item.to_account_id) ?? "—"}</p><p className="text-sm">{item.description ?? "—"}</p></article>)}</div>
  </>;
}
