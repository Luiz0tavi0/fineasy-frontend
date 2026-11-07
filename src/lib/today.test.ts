import { describe, expect, it, vi } from "vitest";
import { today } from "./today";

describe("today", () => {
  it("usa componentes da data local", () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date(2026, 10, 7, 23, 30));
    expect(today()).toBe("2026-11-07");
    vi.useRealTimers();
  });
});
