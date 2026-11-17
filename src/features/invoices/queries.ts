import { useQuery } from "@tanstack/react-query";
import { clientApi } from "@/api/client";
import { requireData } from "@/lib/api-result";
import { today } from "@/lib/today";

export const invoiceKeys = {
  all: ["invoices"] as const,
  list: (date: string) => ["invoices", "list", date] as const,
  detail: (id: number, date: string) => ["invoices", "detail", id, date] as const,
};

export async function fetchInvoices(date: string) {
  const result = await clientApi.GET("/invoices", { params: { query: { today: date } } });
  return requireData(result.data, result.error, "Não foi possível carregar as faturas.");
}

export async function fetchInvoice(id: number, date: string) {
  const result = await clientApi.GET("/invoices/{invoice_id}", { params: { path: { invoice_id: id }, query: { today: date } } });
  return requireData(result.data, result.error, "Não foi possível carregar a fatura.");
}

export function useInvoicesQuery(date = today()) {
  return useQuery({ queryKey: invoiceKeys.list(date), queryFn: () => fetchInvoices(date) });
}

export function useInvoiceQuery(id: number, date = today()) {
  return useQuery({ queryKey: invoiceKeys.detail(id, date), queryFn: () => fetchInvoice(id, date) });
}
