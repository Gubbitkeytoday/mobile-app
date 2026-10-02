export function formatTHB(amount: number, opts: { decimals?: boolean } = {}): string {
  const decimals = opts.decimals ?? !Number.isInteger(amount);
  return `฿${amount.toLocaleString('th-TH', {
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  })}`;
}

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
