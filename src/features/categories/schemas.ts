import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Informe o nome").max(120, "Use até 120 caracteres"),
});
