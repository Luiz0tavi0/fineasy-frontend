import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { clientApi } from "@/api/client";
import { requireData, requireSuccess } from "@/lib/api-result";
import { categoryKeys } from "./queries";
import type { CategoryCreate, CategoryUpdate } from "./types";

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: CategoryCreate) => {
      const result = await clientApi.POST("/categories", { body });
      return requireData(result.data, result.error, "Não foi possível criar a categoria.");
    },
    onSuccess: async () => { await qc.invalidateQueries({ queryKey: categoryKeys.all }); toast.success("Categoria criada."); },
    onError: (error) => toast.error(error.message),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: { id: number; body: CategoryUpdate }) => {
      const result = await clientApi.PATCH("/categories/{category_id}", { params: { path: { category_id: id } }, body });
      return requireData(result.data, result.error, "Não foi possível atualizar a categoria.");
    },
    onSuccess: async () => { await qc.invalidateQueries({ queryKey: categoryKeys.all }); toast.success("Categoria atualizada."); },
    onError: (error) => toast.error(error.message),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const result = await clientApi.DELETE("/categories/{category_id}", { params: { path: { category_id: id } } });
      requireSuccess(result.error, "Não foi possível excluir a categoria.");
    },
    onSuccess: async () => { await qc.invalidateQueries({ queryKey: categoryKeys.all }); toast.success("Categoria excluída."); },
    onError: (error) => toast.error(error.message),
  });
}
