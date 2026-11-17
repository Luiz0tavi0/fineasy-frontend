import { describe, expect, it } from "vitest";
import { accountSchema } from "./schemas";

describe("accountSchema", () => {
  it("accepts string balances with up to two decimal places", () => {
    expect(accountSchema.safeParse({ name: "Conta", account_type: "BANK", initial_balance: "1200.50" }).success).toBe(true);
  });

  it("rejects malformed or negative balances", () => {
    for (const initial_balance of ["1.234", "-1.00", "1,20"]) {
      expect(accountSchema.safeParse({ name: "Conta", account_type: "BANK", initial_balance }).success).toBe(false);
    }
  });
});
