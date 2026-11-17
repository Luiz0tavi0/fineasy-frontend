import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { clientApi } from "@/api/client";
import { requireData, requireSuccess } from "@/lib/api-result";
import { recurrenceKeys } from "./queries";
import type { RecurrenceConfirm, RecurrenceCreate, RecurrenceUpdate } from "./types";

export function useSimulateRecurrence() {
  return useMutation({
    mutationFn: async (body: RecurrenceCreate) => {
      const result = await clientApi.POST("/recurrence-rules/simulate", { body });
      return requireData(result.data, result.error, "Não foi possível simular as ocorrências.");
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useConfirmRecurrence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: RecurrenceConfirm) => {
      const result = await clientApi.POST("/recurrence-rules/confirm", { body });
      return requireData(result.data, result.error, "Não foi possível confirmar a recorrência.");
    },
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: recurrenceKeys.all }),
        qc.invalidateQueries({ queryKey: ["transactions"] }),
        qc.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
      toast.success("Recorrência criada.");
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useUpdateRecurrence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: { id: number; body: RecurrenceUpdate }) => {
      const result = await clientApi.PATCH("/recurrence-rules/{rule_id}", { params: { path: { rule_id: id } }, body });
      return requireData(result.data, result.error, "Não foi possível atualizar a recorrência.");
    },
    onSuccess: async () => { await qc.invalidateQueries({ queryKey: recurrenceKeys.all }); toast.success("Recorrência atualizada."); },
    onError: (error) => toast.error(error.message),
  });
}

export function useDeleteRecurrence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const result = await clientApi.DELETE("/recurrence-rules/{rule_id}", { params: { path: { rule_id: id } } });
      requireSuccess(result.error, "Não foi possível excluir a recorrência.");
    },
    onSuccess: async () => { await Promise.all([qc.invalidateQueries({ queryKey: recurrenceKeys.all }), qc.invalidateQueries({ queryKey: ["transactions"] }), qc.invalidateQueries({ queryKey: ["dashboard"] })]); toast.success("Recorrência excluída."); },
    onError: (error) => toast.error(error.message),
  });
}
