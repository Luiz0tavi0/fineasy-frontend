import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { Suspense } from "react";
import { getAuthenticatedServerApi } from "@/api/server";
import { requireData } from "@/lib/api-result";
import { CategoriesTable, CreateCategoryDialog, categoryKeys } from "@/features/categories";
import { PageTitle } from "@/components/ui";

async function CategoriesContent() {
  const api = await getAuthenticatedServerApi();
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: categoryKeys.all,
    queryFn: async () => {
      const result = await api.GET("/categories");
      return requireData(result.data, result.error, "Não foi possível carregar as categorias.");
    },
  });
  return <HydrationBoundary state={dehydrate(queryClient)}><CategoriesTable /></HydrationBoundary>;
}

export default function CategoriesPage() {
  return <section><PageTitle title="Categorias" description="Organize suas receitas e despesas." action={<CreateCategoryDialog />} /><Suspense fallback={<div className="h-48 animate-pulse rounded-lg bg-slate-200" />}><CategoriesContent /></Suspense></section>;
}
