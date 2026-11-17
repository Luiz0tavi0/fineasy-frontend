"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge, Dialog, EmptyState, SecondaryButton } from "@/components/ui";
import { formatDateBR } from "@/lib/dates";
import { InvoicePaymentForm } from "./invoice-payment-form";
import { useInvoicesQuery } from "./queries";
import { useCreditCardsQuery } from "@/features/credit-cards";
import type { Invoice } from "./types";

const statusNames = { OPEN: "Aberta", CLOSED: "Fechada", PAID: "Paga" } as const;

export function InvoicesTable({ date }: Readonly<{ date: string }>) {
  const invoices = useInvoicesQuery(date);
  const cards = useCreditCardsQuery();
  const [paying, setPaying] = useState<Invoice>();
  if (invoices.isPending || cards.isPending) return <div className="h-48 animate-pulse rounded-lg bg-slate-200" />;
  if (invoices.error || cards.error) return <p role="alert" className="text-red-700">{invoices.error?.message ?? cards.error?.message}</p>;
  if (!invoices.data.length) return <EmptyState message="Nenhuma fatura encontrada." action={<Link className="underline" href="/credit-cards">Cadastre um cartão de crédito</Link>} />;
  const cardNames = new Map(cards.data.map((item) => [item.id, item.name]));
  return <>
    <div className="hidden overflow-x-auto rounded-lg border bg-white md:block"><table className="w-full text-left text-sm"><thead className="bg-slate-100"><tr><th className="p-3">Cartão</th><th className="p-3">Fechamento</th><th className="p-3">Vencimento</th><th className="p-3">Status</th><th className="p-3">Ações</th></tr></thead><tbody className="divide-y">{invoices.data.map((invoice) => <tr key={invoice.id}><td className="p-3 font-medium"><Link className="hover:underline" href={`/invoices/${invoice.id}`}>{cardNames.get(invoice.credit_card_id) ?? "Cartão não encontrado"}</Link></td><td className="p-3">{formatDateBR(invoice.closing_date)}</td><td className="p-3">{formatDateBR(invoice.due_date)}</td><td className="p-3"><Badge variant={invoice.status === "PAID" ? "secondary" : "outline"}>{statusNames[invoice.status]}</Badge></td><td className="p-3">{invoice.status !== "PAID" && <SecondaryButton onClick={() => setPaying(invoice)} type="button">Pagar</SecondaryButton>}</td></tr>)}</tbody></table></div>
    <div className="space-y-3 md:hidden">{invoices.data.map((invoice) => <article className="rounded-lg border bg-white p-4" key={invoice.id}><Link className="font-semibold" href={`/invoices/${invoice.id}`}>{cardNames.get(invoice.credit_card_id) ?? "Cartão não encontrado"}</Link><p className="mt-1 text-sm text-slate-600">Fecha {formatDateBR(invoice.closing_date)} · vence {formatDateBR(invoice.due_date)}</p><Badge className="mt-2" variant={invoice.status === "PAID" ? "secondary" : "outline"}>{statusNames[invoice.status]}</Badge>{invoice.status !== "PAID" && <SecondaryButton className="mt-3" onClick={() => setPaying(invoice)} type="button">Pagar</SecondaryButton>}</article>)}</div>
    <Dialog open={Boolean(paying)} onClose={() => setPaying(undefined)} title="Pagar fatura">{paying && <InvoicePaymentForm invoice={paying} onClose={() => setPaying(undefined)} />}</Dialog>
  </>;
}
