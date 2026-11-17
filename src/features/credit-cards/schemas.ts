import { z } from "zod";

export const creditCardSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome").max(120, "Use até 120 caracteres"),
  closing_day: z.coerce.number().int().min(1, "Informe um dia entre 1 e 31").max(31, "Informe um dia entre 1 e 31"),
  due_day: z.coerce.number().int().min(1, "Informe um dia entre 1 e 31").max(31, "Informe um dia entre 1 e 31"),
  suggested_payment_account_id: z.union([z.coerce.number().int().positive(), z.literal("")]).transform((value) => value === "" ? null : value),
});
