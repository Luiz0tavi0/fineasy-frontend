import { describe, expect, it } from "vitest";
import { transferSchema } from "./schemas";

describe("transferSchema", () => {
  it("requires different accounts and a positive string amount", () => {
    const sameAccount = transferSchema.safeParse({
      from_account_id: "1",
      to_account_id: "1",
      amount: "10.00",
      description: "",
      date: "2026-11-07",
    });
    expect(sameAccount.success).toBe(false);

    const invalidAmount = transferSchema.safeParse({
      from_account_id: "1",
      to_account_id: "2",
      amount: "0.00",
      description: "",
      date: "2026-11-07",
    });
    expect(invalidAmount.success).toBe(false);
  });
});
