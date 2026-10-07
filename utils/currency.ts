export function sanitizeCurrency(value: unknown): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
  }

  const digits = String(value ?? "").replace(/[^0-9]/g, "");
  return digits ? Number(digits) : 0;
}

export function formatCurrency(value: unknown): string {
  return `Rp ${sanitizeCurrency(value).toLocaleString("id-ID")}`;
}
