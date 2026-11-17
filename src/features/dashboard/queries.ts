import { clientApi } from "@/api/client";
import { useQuery } from "@tanstack/react-query";
import { requireData } from "@/lib/api-result";
export const dashboardKey = (month: string) => ["dashboard", month] as const;
export function useDashboardData(month: string) {
  return useQuery({
    queryKey: dashboardKey(month),
    queryFn: async () => {
      const [accounts, transactions, invoices, creditCards] = await Promise.all([
        clientApi.GET("/accounts"),
        clientApi.GET("/transactions", { params: { query: { month, status: "PENDING", per_page: 100 } } }),
        clientApi.GET("/invoices", { params: { query: { today: `${month}-01` } } }),
        clientApi.GET("/credit-cards"),
      ]);
      return {
        accounts: requireData(accounts.data, accounts.error, "Não foi possível carregar as contas."),
        transactions: requireData(transactions.data, transactions.error, "Não foi possível carregar as transações."),
        invoices: requireData(invoices.data, invoices.error, "Não foi possível carregar as faturas."),
        creditCards: requireData(creditCards.data, creditCards.error, "Não foi possível carregar os cartões."),
      };
    },
  });
}
