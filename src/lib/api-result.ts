export function requireData<T>(data: T | undefined, error: unknown, fallback: string): T {
  if (error || data === undefined) {
    const detail =
      typeof error === "object" && error !== null && "detail" in error
        ? String(error.detail)
        : fallback;
    throw new Error(detail || fallback);
  }
  return data;
}

export function requireSuccess(error: unknown, fallback: string): void {
  if (error) {
    const detail =
      typeof error === "object" && error !== null && "detail" in error
        ? String(error.detail)
        : fallback;
    throw new Error(detail || fallback);
  }
}
