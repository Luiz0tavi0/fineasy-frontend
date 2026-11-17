import { z } from "zod";
import { parseMoney } from "@/lib/money";

export const recurrenceSchema = z.object({
  description: z.string().trim().min(1, "Informe a descrição").max(255, "Use até 255 caracteres"),
  account_id: z.coerce.number().int().positive("Selecione uma conta"),
  category_id: z.union([z.coerce.number().int().positive(), z.literal("")]).transform((value) => value === "" ? null : value),
  anchor_day: z.coerce.number().int().min(1, "Informe um dia entre 1 e 31").max(31, "Informe um dia entre 1 e 31"),
  start_month: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe um mês válido"),
  count: z.coerce.number().int().min(1, "Mínimo de 1 ocorrência").max(36, "Máximo de 36 ocorrências"),
  variable_amount: z.boolean(),
  estimated_amount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Informe um valor válido").refine((value) => /^\d+(\.\d{1,2})?$/.test(value) && parseMoney(value).greaterThan(0), "O valor deve ser maior que zero"),
  direction: z.enum(["EXPENSE", "INCOME"]),
});

export const recurrenceEditSchema = z.object({
  description: z.string().trim().min(1, "Informe a descrição").max(255, "Use até 255 caracteres"),
  estimated_amount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Informe um valor válido").refine((value) => /^\d+(\.\d{1,2})?$/.test(value) && parseMoney(value).greaterThan(0), "O valor deve ser maior que zero"),
  category_id: z.union([z.coerce.number().int().positive(), z.literal("")]).transform((value) => value === "" ? null : value),
});
