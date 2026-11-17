import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { clientApi } from "@/api/client";
import { requireData, requireSuccess } from "@/lib/api-result";
import { accountKeys } from "./queries";
import type { AccountCreate, AccountUpdate } from "./types";

export function useCreateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: AccountCreate) => {
      const result = await clientApi.POST("/accounts", { body });
      return requireData(result.data, result.error, "Não foi possível criar a conta.");
    },
    onSuccess: async () => {
      await Promise.all([qc.invalidateQueries({ queryKey: accountKeys.all }), qc.invalidateQueries({ queryKey: ["dashboard"] })]);
      toast.success("Conta criada.");
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useUpdateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: { id: number; body: AccountUpdate }) => {
      const result = await clientApi.PATCH("/accounts/{account_id}", { params: { path: { account_id: id } }, body });
      return requireData(result.data, result.error, "Não foi possível atualizar a conta.");
    },
    onSuccess: async () => {
      await Promise.all([qc.invalidateQueries({ queryKey: accountKeys.all }), qc.invalidateQueries({ queryKey: ["dashboard"] })]);
      toast.success("Conta atualizada.");
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const result = await clientApi.DELETE("/accounts/{account_id}", { params: { path: { account_id: id } } });
      requireSuccess(result.error, "Não foi possível excluir a conta.");
    },
    onSuccess: async () => {
      await Promise.all([qc.invalidateQueries({ queryKey: accountKeys.all }), qc.invalidateQueries({ queryKey: ["dashboard"] })]);
      toast.success("Conta excluída.");
    },
    onError: (error) => toast.error(error.message),
  });
}
