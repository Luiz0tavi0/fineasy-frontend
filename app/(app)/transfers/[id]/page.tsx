import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getAuthenticatedServerApi } from "@/api/server";
import { requireData } from "@/lib/api-result";
import { formatBRL } from "@/lib/money";
import { formatDateBR } from "@/lib/dates";
import { PageTitle } from "@/components/ui";

async function TransferDetail({ id }: Readonly<{ id: number }>) {
  const api = await getAuthenticatedServerApi();
  const [transferResult, accountsResult] = await Promise.all([
    api.GET("/transfers/{transfer_id}", { params: { path: { transfer_id: id } } }),
    api.GET("/accounts"),
  ]);
  if (transferResult.error || !transferResult.data) notFound();
  const transfer = requireData(transferResult.data, transferResult.error, "Transferência não encontrada.");
  const accounts = requireData(accountsResult.data, accountsResult.error, "Não foi possível carregar as contas.");
  return <dl className="grid max-w-2xl gap-4 rounded-xl border bg-white p-5 sm:grid-cols-2">
    <div><dt className="text-sm text-slate-500">Data</dt><dd>{formatDateBR(transfer.date)}</dd></div>
    <div><dt className="text-sm text-slate-500">Valor</dt><dd className="font-medium">{formatBRL(transfer.amount)}</dd></div>
    <div><dt className="text-sm text-slate-500">Origem</dt><dd>{accounts.find((item) => item.id === transfer.from_account_id)?.name ?? "—"}</dd></div>
    <div><dt className="text-sm text-slate-500">Destino</dt><dd>{accounts.find((item) => item.id === transfer.to_account_id)?.name ?? "—"}</dd></div>
    <div className="sm:col-span-2"><dt className="text-sm text-slate-500">Descrição</dt><dd>{transfer.description ?? "—"}</dd></div>
  </dl>;
}

export default async function TransferPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId < 1) notFound();
  return <section><PageTitle title="Detalhe da transferência" /><Suspense fallback={<div className="h-48 max-w-2xl animate-pulse rounded-lg bg-slate-200" />}><TransferDetail id={numericId} /></Suspense></section>;
}
