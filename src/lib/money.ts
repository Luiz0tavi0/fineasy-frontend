import Decimal from "decimal.js";

export function parseMoney(value: string): Decimal {
  return new Decimal(value);
}

export function formatBRL(value: Decimal | string): string {
  const amount = typeof value === "string" ? parseMoney(value) : value;
  const fixed = amount.abs().toFixed(2);
  const [integer, fraction] = fixed.split(".");
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${amount.isNegative() ? "-" : ""}R$ ${grouped},${fraction}`;
}

export function addMoney(a: string, b: string): string {
  return parseMoney(a).plus(parseMoney(b)).toFixed(2);
}
