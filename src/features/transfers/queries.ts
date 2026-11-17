import { useQuery } from "@tanstack/react-query";
import { clientApi } from "@/api/client";
import { requireData } from "@/lib/api-result";

export const transferKeys = {
  all: ["transfers"] as const,
  detail: (id: number) => ["transfers", id] as const,
};

export async function fetchTransfers() {
  const result = await clientApi.GET("/transfers");
  return requireData(result.data, result.error, "Não foi possível carregar as transferências.");
}

export async function fetchTransfer(id: number) {
  const result = await clientApi.GET("/transfers/{transfer_id}", { params: { path: { transfer_id: id } } });
  return requireData(result.data, result.error, "Não foi possível carregar a transferência.");
}

export function useTransfersQuery() {
  return useQuery({ queryKey: transferKeys.all, queryFn: fetchTransfers });
}

export function useTransferQuery(id: number) {
  return useQuery({ queryKey: transferKeys.detail(id), queryFn: () => fetchTransfer(id) });
}
