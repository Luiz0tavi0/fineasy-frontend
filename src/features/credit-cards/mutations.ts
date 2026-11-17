import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { clientApi } from "@/api/client";
import { requireData, requireSuccess } from "@/lib/api-result";
import { creditCardKeys } from "./queries";
import type { CreditCardCreate, CreditCardUpdate } from "./types";

export function useCreateCreditCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreditCardCreate) => {
      const result = await clientApi.POST("/credit-cards", { body });
      return requireData(result.data, result.error, "Não foi possível criar o cartão.");
    },
    onSuccess: async () => { await qc.invalidateQueries({ queryKey: creditCardKeys.all }); toast.success("Cartão criado."); },
    onError: (error) => toast.error(error.message),
  });
}

export function useUpdateCreditCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: { id: number; body: CreditCardUpdate }) => {
      const result = await clientApi.PATCH("/credit-cards/{card_id}", { params: { path: { card_id: id } }, body });
      return requireData(result.data, result.error, "Não foi possível atualizar o cartão.");
    },
    onSuccess: async () => { await Promise.all([qc.invalidateQueries({ queryKey: creditCardKeys.all }), qc.invalidateQueries({ queryKey: ["invoices"] })]); toast.success("Cartão atualizado."); },
    onError: (error) => toast.error(error.message),
  });
}

export function useDeleteCreditCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const result = await clientApi.DELETE("/credit-cards/{card_id}", { params: { path: { card_id: id } } });
      requireSuccess(result.error, "Não foi possível excluir o cartão.");
    },
    onSuccess: async () => { await Promise.all([qc.invalidateQueries({ queryKey: creditCardKeys.all }), qc.invalidateQueries({ queryKey: ["invoices"] })]); toast.success("Cartão excluído."); },
    onError: (error) => toast.error(error.message),
  });
}
