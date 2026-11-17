import { useQuery } from "@tanstack/react-query";
import { clientApi } from "@/api/client";
import { requireData } from "@/lib/api-result";

export const creditCardKeys = { all: ["credit-cards"] as const };

export async function fetchCreditCards() {
  const result = await clientApi.GET("/credit-cards");
  return requireData(result.data, result.error, "Não foi possível carregar os cartões.");
}

export function useCreditCardsQuery() {
  return useQuery({ queryKey: creditCardKeys.all, queryFn: fetchCreditCards });
}
