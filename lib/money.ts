export function poundsToPence(value: string | number) {
  const numeric = typeof value === 'number' ? value : Number(value.replace(/[^0-9.-]/g, ''));
  if (!Number.isFinite(numeric)) return 0;
  return Math.round(numeric * 100);
}

export function formatMoney(pence: number, currency = 'GBP') {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(pence / 100);
}

export function calculateQuote(laborCost: number, materialsCost: number, vatRate = 0) {
  const net = laborCost + materialsCost;
  const vatAmount = Math.round(net * vatRate);
  return { net, vatAmount, totalAmount: net + vatAmount };
}
