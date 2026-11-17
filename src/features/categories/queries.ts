import { useQuery } from "@tanstack/react-query";
import { clientApi } from "@/api/client";
import { requireData } from "@/lib/api-result";

export const categoryKeys = { all: ["categories"] as const };

export async function fetchCategories() {
  const result = await clientApi.GET("/categories");
  return requireData(result.data, result.error, "Não foi possível carregar as categorias.");
}

export function useCategoriesQuery() {
  return useQuery({ queryKey: categoryKeys.all, queryFn: fetchCategories });
}
