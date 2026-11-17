import { z } from "zod";
import { parseMoney } from "@/lib/money";

const moneyPattern = /^\d+(\.\d{1,2})?$/;
const positiveMoney = z.string()
  .regex(moneyPattern, "Informe um valor válido")
  .refine((value) => moneyPattern.test(value) && parseMoney(value).greaterThan(0), "O valor deve ser maior que zero");
const nonNegativeMoney = z.string()
  .regex(moneyPattern, "Informe um valor válido")
  .refine((value) => moneyPattern.test(value) && parseMoney(value).greaterThanOrEqualTo(0), "O valor não pode ser negativo");
const optionalCategoryId = z.union([z.coerce.number().int().positive(), z.literal("")])
  .transform((value) => value === "" ? null : value);

export const invoicePaymentSchema = z.object({
  account_id: z.coerce.number().int().positive("Selecione uma conta"),
  amount: positiveMoney,
  interest_amount: nonNegativeMoney,
  interest_category_id: optionalCategoryId,
  late_fee_amount: nonNegativeMoney,
  late_fee_category_id: optionalCategoryId,
  effective_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida"),
}).superRefine((values, context) => {
  if (moneyPattern.test(values.interest_amount) && parseMoney(values.interest_amount).greaterThan(0) && values.interest_category_id === null) {
    context.addIssue({ code: "custom", path: ["interest_category_id"], message: "Selecione a categoria dos juros" });
  }
  if (moneyPattern.test(values.late_fee_amount) && parseMoney(values.late_fee_amount).greaterThan(0) && values.late_fee_category_id === null) {
    context.addIssue({ code: "custom", path: ["late_fee_category_id"], message: "Selecione a categoria da multa" });
  }
});
