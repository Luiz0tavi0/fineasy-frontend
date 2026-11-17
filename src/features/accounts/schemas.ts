import { z } from "zod";
import { parseMoney } from "@/lib/money";

export const moneySchema = z.string()
  .regex(/^\d+(\.\d{1,2})?$/, "Informe um valor válido com até duas casas decimais")
  .refine((value) => /^\d+(\.\d{1,2})?$/.test(value) && parseMoney(value).greaterThanOrEqualTo(0), "O valor não pode ser negativo");

export const accountSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome").max(120, "Use até 120 caracteres"),
  account_type: z.enum(["CASH", "BANK", "WALLET"], { error: "Selecione o tipo da conta" }),
  initial_balance: moneySchema,
});
