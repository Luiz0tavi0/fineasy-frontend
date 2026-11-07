import { describe, expect, it } from "vitest";
import { formatDateBR, formatDateTimeBR } from "./dates";

describe("datas", () => {
  it("não interpreta datas ISO como UTC", () => { expect(formatDateBR("2026-01-01")).toBe("01/01/2026"); });
  it("formata date-time sem deslocar data", () => { expect(formatDateTimeBR("2026-11-07T14:30:00Z")).toBe("07/11/2026 14:30"); });
});
