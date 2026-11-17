import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { clientApi } from "@/api/client";
import { requireData } from "@/lib/api-result";
import type { TransferCreate } from "./types";

export function useCreateTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: TransferCreate) => {
      const result = await clientApi.POST("/transfers", { body });
      return requireData(result.data, result.error, "Não foi possível criar a transferência.");
    },
    onSuccess: async () => {
      await Promise.all([qc.invalidateQueries({ queryKey: ["transfers"] }), qc.invalidateQueries({ queryKey: ["accounts"] }), qc.invalidateQueries({ queryKey: ["dashboard"] })]);
      toast.success("Transferência criada.");
    },
    onError: (error) => toast.error(error.message),
  });
}
