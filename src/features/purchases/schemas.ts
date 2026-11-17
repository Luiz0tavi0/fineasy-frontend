import { z } from "zod";
import { parseMoney } from "@/lib/money";

export const purchaseSchema = z.object({
  description: z.string().trim().min(1, "Informe a descrição").max(255, "Use até 255 caracteres"),
  total_amount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Informe um valor válido").refine((value) => /^\d+(\.\d{1,2})?$/.test(value) && parseMoney(value).greaterThan(0), "O valor deve ser maior que zero"),
  purchase_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida"),
  installment_total: z.coerce.number().int().min(1, "Mínimo de 1 parcela").max(120, "Máximo de 120 parcelas"),
  account_id: z.union([z.coerce.number().int().positive(), z.literal("")]).transform((value) => value === "" ? null : value),
  credit_card_id: z.union([z.coerce.number().int().positive(), z.literal("")]).transform((value) => value === "" ? null : value),
  category_id: z.union([z.coerce.number().int().positive(), z.literal("")]).transform((value) => value === "" ? null : value),
});
