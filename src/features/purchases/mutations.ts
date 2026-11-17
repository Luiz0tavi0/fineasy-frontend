import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { clientApi } from "@/api/client";
import { requireData } from "@/lib/api-result";
import type { PurchaseConfirmRequest, PurchaseSimulationRequest } from "./types";

export function useSimulatePurchase() {
  return useMutation({
    mutationFn: async (body: PurchaseSimulationRequest) => {
      const result = await clientApi.POST("/purchases/simulate", { body });
      return requireData(result.data, result.error, "Não foi possível simular a compra.");
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useConfirmPurchase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: PurchaseConfirmRequest) => {
      const result = await clientApi.POST("/purchases/confirm", { body });
      return requireData(result.data, result.error, "Não foi possível confirmar a compra.");
    },
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["transactions"] }),
        qc.invalidateQueries({ queryKey: ["invoices"] }),
        qc.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
      toast.success("Compra confirmada.");
    },
    onError: (error) => toast.error(error.message),
  });
}
