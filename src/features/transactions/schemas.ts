import { z } from "zod";
import { parseMoney } from "@/lib/money";

const positiveMoney = z.string()
  .regex(/^\d+(\.\d{1,2})?$/, "Informe um valor válido com até duas casas decimais")
  .refine((value) => /^\d+(\.\d{1,2})?$/.test(value) && parseMoney(value).greaterThan(0), "O valor deve ser maior que zero");

export const transactionSchema = z.object({
  account_id: z.coerce.number().int().positive("Selecione uma conta"),
  category_id: z.union([z.coerce.number().int().positive(), z.literal("")]).transform((value) => value === "" ? null : value),
  description: z.string().trim().min(1, "Informe a descrição").max(255, "Use até 255 caracteres"),
  direction: z.enum(["EXPENSE", "INCOME"]),
  estimated_amount: positiveMoney,
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida"),
  competence: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida"), z.literal("")]).transform((value) => value || null),
  amount_locked: z.boolean(),
});

export const transactionEditSchema = z.object({
  description: z.string().trim().min(1, "Informe a descrição").max(255, "Use até 255 caracteres"),
  estimated_amount: positiveMoney,
  amount: positiveMoney.optional(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida"),
  effective_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida").optional(),
  category_id: z.union([z.coerce.number().int().positive(), z.literal("")]).transform((value) => value === "" ? null : value),
  amount_locked: z.boolean(),
  competence: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida"), z.literal("")]).transform((value) => value || null),
});

export const transactionCompleteSchema = z.object({
  amount: positiveMoney,
  effective_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida"),
});

export const transactionAmountSchema = z.object({ amount: positiveMoney });
