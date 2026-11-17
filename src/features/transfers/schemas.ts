import { z } from "zod";
import { parseMoney } from "@/lib/money";

export const transferSchema = z.object({
  from_account_id: z.coerce.number().int().positive("Selecione a conta de origem"),
  to_account_id: z.coerce.number().int().positive("Selecione a conta de destino"),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Informe um valor válido").refine((value) => /^\d+(\.\d{1,2})?$/.test(value) && parseMoney(value).greaterThan(0), "O valor deve ser maior que zero"),
  description: z.string().max(255, "Use até 255 caracteres"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida"),
}).refine((values) => values.from_account_id !== values.to_account_id, {
  path: ["to_account_id"],
  message: "As contas de origem e destino devem ser diferentes",
});
