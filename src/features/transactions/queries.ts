import { useQuery } from "@tanstack/react-query";
import { clientApi } from "@/api/client";
import { requireData } from "@/lib/api-result";
import type { TransactionStatus } from "./types";

export type TransactionFilters = Readonly<{ month: string; status?: TransactionStatus; page: number; per_page: number }>;

export const transactionKeys = {
  all: ["transactions"] as const,
  list: (filters: TransactionFilters) => ["transactions", "list", filters.month, filters.status ?? "", filters.page, filters.per_page] as const,
  detail: (id: number) => ["transactions", "detail", id] as const,
};

export async function fetchTransactions(filters: TransactionFilters) {
  const result = await clientApi.GET("/transactions", { params: { query: filters } });
  return requireData(result.data, result.error, "Não foi possível carregar as transações.");
}

export async function fetchTransaction(id: number) {
  const result = await clientApi.GET("/transactions/{transaction_id}", { params: { path: { transaction_id: id } } });
  return requireData(result.data, result.error, "Não foi possível carregar a transação.");
}

export function useTransactionsQuery(filters: TransactionFilters) {
  return useQuery({ queryKey: transactionKeys.list(filters), queryFn: () => fetchTransactions(filters) });
}

export function useTransactionQuery(id: number) {
  return useQuery({ queryKey: transactionKeys.detail(id), queryFn: () => fetchTransaction(id) });
}
