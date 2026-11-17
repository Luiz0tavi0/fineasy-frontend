"use client";
import { useState } from "react";
import { useDashboardData } from "./queries";
import { formatMonthLabel, shiftMonth } from "./month";
import { formatBRL, parseMoney } from "@/lib/money";
import { formatDateBR } from "@/lib/dates";
import { Input, Panel, SecondaryButton } from "@/components/ui";
import Link from "next/link";
import { today } from "@/lib/today";
import { CompleteTransactionAction } from "@/features/transactions";

function DashboardLoading() {
  return <div className="space-y-8"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <div className="h-28 animate-pulse rounded-lg bg-slate-200" key={i} />)}</div><div className="h-48 animate-pulse rounded-lg bg-slate-200" /></div>;
}

function DashboardSummary({ data, month }: Readonly<{ data: NonNullable<ReturnType<typeof useDashboardData>["data"]>; month: string }>) {
  const currentBalance = data.accounts.reduce((sum, item) => sum.plus(parseMoney(item.current_balance)), parseMoney("0"));
  const payable = data.transactions.filter((item) => item.direction === "EXPENSE").reduce((sum, item) => sum.plus(parseMoney(item.estimated_amount)), parseMoney("0"));
  const receivable = data.transactions.filter((item) => item.direction === "INCOME").reduce((sum, item) => sum.plus(parseMoney(item.estimated_amount)), parseMoney("0"));
  const projected = currentBalance.plus(receivable).minus(payable);
  const currentDate = today();
  const cutoffDate = month === currentDate.slice(0, 7) ? currentDate : `${month}-01`;
  const weekLimit = new Date(`${cutoffDate}T12:00:00`);
  weekLimit.setDate(weekLimit.getDate() + 7);
  const weekEnd = `${weekLimit.getFullYear()}-${String(weekLimit.getMonth() + 1).padStart(2, "0")}-${String(weekLimit.getDate()).padStart(2, "0")}`;
  const upcoming = data.transactions
    .filter((item) => item.status === "PENDING")
    .sort((a, b) => a.due_date.localeCompare(b.due_date));
  const groups = [
    [month === currentDate.slice(0, 7) ? "Atrasadas" : "Antes do período", upcoming.filter((item) => item.due_date < cutoffDate)],
    [month === currentDate.slice(0, 7) ? "Hoje" : "Início do período", upcoming.filter((item) => item.due_date === cutoffDate)],
    ["Próximos 7 dias", upcoming.filter((item) => item.due_date > cutoffDate && item.due_date <= weekEnd)],
    ["Mais adiante", upcoming.filter((item) => item.due_date > weekEnd)],
  ] as const;
  const openInvoices = data.invoices.filter((item) => item.status === "OPEN" || item.status === "CLOSED");
  const cardNames = new Map(data.creditCards.map((card) => [card.id, card.name]));
  const stats = [["Saldo atual", currentBalance], ["Saldo projetado", projected], ["A pagar", payable], ["A receber", receivable]] as const;
  return <div className="space-y-8">
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map(([label, amount]) => <section className="rounded-xl border bg-white p-5 shadow-sm" key={label}><p className="text-sm text-slate-600">{label}</p><strong className="mt-2 block text-xl">{formatBRL(amount)}</strong></section>)}</div>
    <Panel title="Próximas transações">
      {upcoming.length ? <div className="space-y-5">{groups.filter(([, items]) => items.length > 0).map(([label, items]) => <section key={label}>
        <h3 className="mb-2 text-sm font-semibold text-slate-600">{label}</h3>
        <ul className="divide-y">{items.map((item) => <li className="flex flex-wrap items-center justify-between gap-3 py-3" key={item.id}>
          <div className="min-w-40 flex-1">
            <Link className="font-medium hover:underline" href={`/transactions/${item.id}`}>{item.description}</Link>
            <p className="text-sm text-slate-600">{item.direction === "EXPENSE" ? "Despesa" : "Receita"} · {formatDateBR(item.due_date)}</p>
          </div>
          <span className="text-sm font-medium">{formatBRL(item.estimated_amount)}</span>
          <CompleteTransactionAction transaction={item} />
        </li>)}</ul>
      </section>)}</div> : <p className="text-sm text-slate-600">Nenhuma transação pendente neste período.</p>}
    </Panel>
    <Panel title="Faturas abertas">
      {openInvoices.length ? <ul className="divide-y">{openInvoices.map((item) => <li className="flex flex-wrap justify-between gap-2 py-3 text-sm" key={item.id}><Link className="font-medium hover:underline" href={`/invoices/${item.id}`}>{cardNames.get(item.credit_card_id) ?? "Cartão não encontrado"}</Link><span>{formatDateBR(item.due_date)} · {item.status === "OPEN" ? "Aberta" : "Fechada"}</span></li>)}</ul> : <p className="text-sm text-slate-600">Nenhuma fatura aberta ou fechada.</p>}
    </Panel>
  </div>;
}

export function DashboardView({ month: initialMonth }: Readonly<{ month: string }>) {
  const [month, setMonth] = useState(initialMonth);
  const { data, isLoading, error } = useDashboardData(month);
  return <div className="space-y-8">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm font-medium text-slate-600">Período</p>
      <div aria-label="Navegação por mês" className="flex flex-wrap items-center justify-end gap-2" role="group">
        <SecondaryButton onClick={() => setMonth((value) => shiftMonth(value, -1))} type="button">Mês anterior</SecondaryButton>
        <p aria-live="polite" className="min-w-36 text-center font-medium capitalize">{formatMonthLabel(month)}</p>
        <label className="sr-only" htmlFor="dashboard-month">Escolher mês e ano</label>
        <Input className="mt-0 w-40" id="dashboard-month" onChange={(event) => { if (event.currentTarget.value) setMonth(event.currentTarget.value); }} type="month" value={month} />
        <SecondaryButton onClick={() => setMonth((value) => shiftMonth(value, 1))} type="button">Próximo mês</SecondaryButton>
      </div>
    </div>
    {isLoading ? <DashboardLoading /> : error || !data ? <p role="alert">Não foi possível carregar o dashboard.</p> : <DashboardSummary data={data} month={month} />}
  </div>;
}
