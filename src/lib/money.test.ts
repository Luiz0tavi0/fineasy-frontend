import { describe, expect, it } from "vitest";
import Decimal from "decimal.js";
import { addMoney, formatBRL, parseMoney } from "./money";

describe("money", () => {
  it("preserva precisão decimal sem passar por number", () => {
    expect(parseMoney("1234567890.12").equals(new Decimal("1234567890.12"))).toBe(true);
  });
  it("formata valores como BRL", () => {
    expect(formatBRL("-1234.5")).toBe("-R$ 1.234,50");
  });
  it.each([["0.00", "R$ 0,00"], ["-12.34", "-R$ 12,34"], ["1234.56", "R$ 1.234,56"]])("formata %s", (value, expected) => expect(formatBRL(value)).toBe(expected));
  it("rejeita entrada inválida e soma sem number", () => {
    expect(() => parseMoney("inválido")).toThrow();
    expect(addMoney("0.10", "0.20")).toBe("0.30");
  });
});
