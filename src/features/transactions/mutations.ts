import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { clientApi } from "@/api/client";
import { requireData, requireSuccess } from "@/lib/api-result";
import type { TransactionAmountUpdate, TransactionComplete, TransactionCreate, TransactionPatch } from "./types";

async function invalidate(qc: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    qc.invalidateQueries({ queryKey: ["transactions"] }),
    qc.invalidateQueries({ queryKey: ["accounts"] }),
    qc.invalidateQueries({ queryKey: ["invoices"] }),
    qc.invalidateQueries({ queryKey: ["dashboard"] }),
  ]);
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: TransactionCreate) => {
      const result = await clientApi.POST("/transactions", { body });
      return requireData(result.data, result.error, "Não foi possível criar a transação.");
    },
    onSuccess: async () => { await invalidate(qc); toast.success("Transação criada."); },
    onError: (error) => toast.error(error.message),
  });
}

export function useUpdateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: { id: number; body: TransactionPatch }) => {
      const result = await clientApi.PATCH("/transactions/{transaction_id}", { params: { path: { transaction_id: id } }, body });
      return requireData(result.data, result.error, "Não foi possível atualizar a transação.");
    },
    onSuccess: async () => { await invalidate(qc); toast.success("Transação atualizada."); },
    onError: (error) => toast.error(error.message),
  });
}

export function useCompleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: { id: number; body: TransactionComplete }) => {
      const result = await clientApi.POST("/transactions/{transaction_id}/complete", { params: { path: { transaction_id: id } }, body });
      return requireData(result.data, result.error, "Não foi possível concluir a transação.");
    },
    onSuccess: async () => { await invalidate(qc); toast.success("Transação concluída."); },
    onError: (error) => toast.error(error.message),
  });
}

export function useUpdateCompletedAmount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: { id: number; body: TransactionAmountUpdate }) => {
      const result = await clientApi.PATCH("/transactions/{transaction_id}/amount", { params: { path: { transaction_id: id } }, body });
      return requireData(result.data, result.error, "Não foi possível atualizar o valor.");
    },
    onSuccess: async () => { await invalidate(qc); toast.success("Valor atualizado."); },
    onError: (error) => toast.error(error.message),
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const result = await clientApi.DELETE("/transactions/{transaction_id}", { params: { path: { transaction_id: id } } });
      requireSuccess(result.error, "Não foi possível excluir a transação.");
    },
    onSuccess: async () => { await invalidate(qc); toast.success("Transação excluída."); },
    onError: (error) => toast.error(error.message),
  });
}
