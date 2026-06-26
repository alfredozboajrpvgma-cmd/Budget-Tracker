import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { toNumber } from '../utils/format';

export interface CurrencyOption {
  code: string;
  symbol: string;
  name: string;
}

export const CURRENCIES: CurrencyOption[] = [
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'KRW', symbol: '₩', name: 'Korean Won' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
];

interface CurrencyContextValue {
  currency: CurrencyOption;
  setCurrency: (currency: CurrencyOption) => void;
  fmt: (amount: number) => string;
  symbol: string;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyOption>(() => {
    const saved = localStorage.getItem('pinkcloud_currency');
    if (saved) {
      const found = CURRENCIES.find(c => c.code === saved);
      if (found) return found;
    }
    return CURRENCIES[0]; // PHP default
  });

  const setCurrency = useCallback((c: CurrencyOption) => {
    setCurrencyState(c);
    localStorage.setItem('pinkcloud_currency', c.code);
  }, []);

  const fmt = useCallback((amount: number) => {
    return `${currency.symbol}${toNumber(amount).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  }, [currency]);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, fmt, symbol: currency.symbol }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
}
