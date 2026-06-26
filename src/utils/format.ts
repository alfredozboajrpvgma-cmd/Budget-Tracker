export const toNumber = (value: unknown): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') return parseNumberInput(value);
  return 0;
};

export const formatNumberInput = (value: string) => {
  if (!value) return '';

  let raw = value.replace(/[^0-9.]/g, '');

  const parts = raw.split('.');
  if (parts.length > 2) {
    raw = parts[0] + '.' + parts.slice(1).join('');
  }

  const finalParts = raw.split('.');
  finalParts[0] = finalParts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  return finalParts.join('.');
};

export const parseNumberInput = (value: string) => {
  const cleaned = value.replace(/,/g, '').trim();
  if (!cleaned) return 0;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const formatAmount = (value: unknown, withDecimals = false) => {
  const amount = toNumber(value);
  if (withDecimals) {
    return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return amount.toLocaleString(undefined, { maximumFractionDigits: 2 });
};
