import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { clientApi } from "@/api/client";
import { requireData } from "@/lib/api-result";
import type { InvoicePayment } from "./types";

export function usePayInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: { id: number; body: InvoicePayment }) => {
      const result = await clientApi.POST("/invoices/{invoice_id}/pay", { params: { path: { invoice_id: id } }, body });
      return requireData(result.data, result.error, "Não foi possível pagar a fatura.");
    },
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["invoices"] }),
        qc.invalidateQueries({ queryKey: ["transactions"] }),
        qc.invalidateQueries({ queryKey: ["accounts"] }),
        qc.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
      toast.success("Pagamento registrado.");
    },
    onError: (error) => toast.error(error.message),
  });
}
