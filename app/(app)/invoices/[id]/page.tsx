import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getAuthenticatedServerApi } from "@/api/server";
import { requireData } from "@/lib/api-result";
import { today } from "@/lib/today";
import { formatDateBR, formatDateTimeBR } from "@/lib/dates";
import { formatBRL, parseMoney } from "@/lib/money";
import { PageTitle } from "@/components/ui";
import { InvoicePaymentDialog } from "@/features/invoices";
import { filterInvoiceTransactions } from "@/features/invoices/invoice-items";
import type { Transaction } from "@/features/transactions/types";

async function InvoiceDetail({ id }: Readonly<{ id: number }>) {
  await connection();
  const date = today();
  const api = await getAuthenticatedServerApi();
  const [invoiceResult, cardsResult, accountsResult] = await Promise.all([
    api.GET("/invoices/{invoice_id}", { params: { path: { invoice_id: id }, query: { today: date } } }),
    api.GET("/credit-cards"),
    api.GET("/accounts"),
  ]);
  if (invoiceResult.error || !invoiceResult.data) notFound();
  const invoice = requireData(invoiceResult.data, invoiceResult.error, "Fatura não encontrada.");
  const cards = requireData(cardsResult.data, cardsResult.error, "Não foi possível carregar os cartões.");
  const accounts = requireData(accountsResult.data, accountsResult.error, "Não foi possível carregar as contas.");
  const invoiceMonths = [...new Set([invoice.closing_date.slice(0, 7), invoice.due_date.slice(0, 7)])];
  const transactionRows: Transaction[] = [];
  const perPage = 100;
  for (const month of invoiceMonths) {
    for (let page = 1; ; page += 1) {
      const result = await api.GET("/transactions", { params: { query: { month, page, per_page: perPage } } });
      const pageData = requireData(result.data, result.error, "Não foi possível carregar as transações da fatura.");
      transactionRows.push(...pageData);
      if (pageData.length < perPage) break;
    }
  }
  const invoiceItems = filterInvoiceTransactions(transactionRows, invoice.id, invoice.payment_transaction_id)
    .sort((left, right) => left.due_date.localeCompare(right.due_date) || left.id - right.id);
  const invoiceItemsTotal = invoiceItems.reduce(
    (sum, item) => sum.plus(item.amount ?? item.estimated_amount),
    parseMoney("0"),
  );
  const paymentResult = invoice.payment_transaction_id
    ? await api.GET("/transactions/{transaction_id}", { params: { path: { transaction_id: invoice.payment_transaction_id } } })
    : null;
  const payment = paymentResult
    ? requireData(paymentResult.data, paymentResult.error, "Não foi possível carregar o pagamento da fatura.")
    : null;
  const card = cards.find((item) => item.id === invoice.credit_card_id);
  const suggestedAccount = accounts.find((item) => item.id === card?.suggested_payment_account_id);
  const statuses = { OPEN: "Aberta", CLOSED: "Fechada", PAID: "Paga" } as const;
  const transactionStatuses = { PENDING: "Pendente", COMPLETED: "Concluída", CANCELLED: "Cancelada" } as const;
  const directions = { EXPENSE: "Despesa", INCOME: "Receita" } as const;
  return <div className="max-w-3xl space-y-5">
    <PageTitle
      title={`Fatura #${invoice.id}`}
      description={card?.name ?? "Cartão não encontrado"}
      action={<InvoicePaymentDialog invoice={invoice} invoiceTotal={invoiceItemsTotal.toFixed(2)} />}
    />
    <section className="rounded-xl border bg-white p-5">
      <h2 className="mb-4 text-lg font-semibold">Resumo da fatura</h2>
      <dl className="grid gap-4 sm:grid-cols-2">
        <div><dt className="text-sm text-slate-500">Status</dt><dd>{statuses[invoice.status]}</dd></div>
        <div><dt className="text-sm text-slate-500">Cartão</dt><dd className="font-medium">{card?.name ?? "Cartão não encontrado"}</dd></div>
        <div><dt className="text-sm text-slate-500">Data de fechamento</dt><dd>{formatDateBR(invoice.closing_date)}</dd></div>
        <div><dt className="text-sm text-slate-500">Data de vencimento</dt><dd>{formatDateBR(invoice.due_date)}</dd></div>
        <div><dt className="text-sm text-slate-500">Dia de fechamento do cartão</dt><dd>{card ? `Dia ${card.closing_day}` : "—"}</dd></div>
        <div><dt className="text-sm text-slate-500">Dia de vencimento do cartão</dt><dd>{card ? `Dia ${card.due_day}` : "—"}</dd></div>
        <div><dt className="text-sm text-slate-500">Conta sugerida para pagamento</dt><dd>{suggestedAccount?.name ?? "Nenhuma"}</dd></div>
        <div><dt className="text-sm text-slate-500">Criada em</dt><dd>{formatDateTimeBR(invoice.created_at)}</dd></div>
        <div><dt className="text-sm text-slate-500">Atualizada em</dt><dd>{formatDateTimeBR(invoice.updated_at)}</dd></div>
      </dl>
    </section>
    <section className="rounded-xl border bg-white p-5">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold">Itens vinculados à fatura</h2>
        {invoiceItems.length > 0 && <p className="text-sm text-slate-600">Soma dos itens: {formatBRL(invoiceItemsTotal)}</p>}
      </div>
      {invoiceItems.length > 0 ? <ul className="divide-y">
        {invoiceItems.map((item) => <li className="flex flex-wrap items-start justify-between gap-3 py-3" key={item.id}>
          <div>
            <Link className="font-medium hover:underline" href={`/transactions/${item.id}`}>{item.description}</Link>
            <p className="mt-1 text-sm text-slate-600">
              {directions[item.direction]} · {formatDateBR(item.due_date)} · {transactionStatuses[item.status]}
              {item.installment_number !== null && item.installment_total !== null ? ` · Parcela ${item.installment_number}/${item.installment_total}` : ""}
            </p>
          </div>
          <div className="text-right">
            <p className="font-medium">{formatBRL(item.amount ?? item.estimated_amount)}</p>
            <p className="text-xs text-slate-500">{item.amount !== null ? "Realizado" : "Estimado"}</p>
          </div>
        </li>)}
      </ul> : <p className="text-sm text-slate-600">Nenhuma transação encontrada com o ID desta fatura.</p>}
    </section>
    <section className="rounded-xl border bg-white p-5">
      <h2 className="mb-4 text-lg font-semibold">Pagamento</h2>
      {payment ? <dl className="grid gap-4 sm:grid-cols-2">
        <div><dt className="text-sm text-slate-500">Transação</dt><dd>#{payment.id} · {payment.description}</dd></div>
        <div><dt className="text-sm text-slate-500">Status</dt><dd>{transactionStatuses[payment.status]}</dd></div>
        <div><dt className="text-sm text-slate-500">Valor</dt><dd>{formatBRL(payment.amount ?? payment.estimated_amount)}</dd></div>
        <div><dt className="text-sm text-slate-500">Data efetiva</dt><dd>{payment.effective_date ? formatDateBR(payment.effective_date) : "—"}</dd></div>
        <div><dt className="text-sm text-slate-500">Conta</dt><dd>{accounts.find((item) => item.id === payment.account_id)?.name ?? "—"}</dd></div>
      </dl> : <p className="text-sm text-slate-600">Ainda não há pagamento registrado para esta fatura.</p>}
    </section>
    <Link className="inline-block text-sm underline" href="/invoices">Voltar às faturas</Link>
  </div>;
}

async function InvoicePageContent({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId < 1) notFound();
  return <InvoiceDetail id={numericId} />;
}

export default function InvoicePage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  return <section><Suspense fallback={<div className="h-48 max-w-3xl animate-pulse rounded-lg bg-slate-200" />}><InvoicePageContent params={params} /></Suspense></section>;
}
