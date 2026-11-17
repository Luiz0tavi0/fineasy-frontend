import { useQuery } from "@tanstack/react-query";
import { clientApi } from "@/api/client";
import { requireData } from "@/lib/api-result";

export const accountKeys = {
  all: ["accounts"] as const,
  detail: (id: number) => ["accounts", id] as const,
};

export async function fetchAccounts() {
  const result = await clientApi.GET("/accounts");
  return requireData(result.data, result.error, "Não foi possível carregar as contas.");
}

export function useAccountsQuery() {
  return useQuery({ queryKey: accountKeys.all, queryFn: fetchAccounts });
}
