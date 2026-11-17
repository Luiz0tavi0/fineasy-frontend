export function cents(value: string): number {
  const [whole = "0", fraction = ""] = value.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0").slice(0, 2));
}

export function brlText(value: string): RegExp {
  const formatted = value.replace(".", "\\.");
  return new RegExp(`R\\$\\s*${formatted}`);
}
