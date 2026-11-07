import { clientApi } from "@/api/client";
import { useQuery } from "@tanstack/react-query";
import { today } from "@/lib/today";
export const dashboardKey = ["dashboard"] as const;
export function useDashboardData() { return useQuery({ queryKey: dashboardKey, queryFn: async () => {
  const current = today();
  const [accounts, transactions, invoices] = await Promise.all([clientApi.GET("/accounts"), clientApi.GET("/transactions", { params: { query: { status: "PENDING", per_page: 100 } } }), clientApi.GET("/invoices", { params: { query: { today: current } } })]);
  if (accounts.error || transactions.error || invoices.error) throw new Error("Não foi possível carregar o painel");
  return { accounts: accounts.data ?? [], transactions: transactions.data ?? [], invoices: invoices.data ?? [] };
}}); }
