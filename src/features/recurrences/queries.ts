import { useQuery } from "@tanstack/react-query";
import { clientApi } from "@/api/client";
import { requireData } from "@/lib/api-result";

export const recurrenceKeys = {
  all: ["recurrences"] as const,
  detail: (id: number) => ["recurrences", id] as const,
};

export async function fetchRecurrences() {
  const result = await clientApi.GET("/recurrence-rules");
  return requireData(result.data, result.error, "Não foi possível carregar as recorrências.");
}

export async function fetchRecurrence(id: number) {
  const result = await clientApi.GET("/recurrence-rules/{rule_id}", { params: { path: { rule_id: id } } });
  return requireData(result.data, result.error, "Não foi possível carregar a recorrência.");
}

export function useRecurrencesQuery() {
  return useQuery({ queryKey: recurrenceKeys.all, queryFn: fetchRecurrences });
}

export function useRecurrenceQuery(id: number) {
  return useQuery({ queryKey: recurrenceKeys.detail(id), queryFn: () => fetchRecurrence(id) });
}
