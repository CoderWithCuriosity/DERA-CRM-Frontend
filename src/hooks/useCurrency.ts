import { useState, useEffect, useCallback } from 'react';
import { organizationApi } from '../api/organization';

export interface CurrencyConfig {
  code: string;
  symbol: string;
  position: 'before' | 'after';
  decimalSeparator: string;
  thousandSeparator: string;
  decimalPlaces: number;
}

const CURRENCY_CONFIGS: Record<string, CurrencyConfig> = {
  USD: {
    code: 'USD',
    symbol: '$',
    position: 'before',
    decimalSeparator: '.',
    thousandSeparator: ',',
    decimalPlaces: 2,
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    position: 'before',
    decimalSeparator: '.',
    thousandSeparator: ',',
    decimalPlaces: 2,
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    position: 'before',
    decimalSeparator: '.',
    thousandSeparator: ',',
    decimalPlaces: 2,
  },
  NGN: {
    code: 'NGN',
    symbol: '₦',
    position: 'before',
    decimalSeparator: '.',
    thousandSeparator: ',',
    decimalPlaces: 2,
  },
  JPY: {
    code: 'JPY',
    symbol: '¥',
    position: 'before',
    decimalSeparator: '.',
    thousandSeparator: ',',
    decimalPlaces: 0,
  },
};

export function useCurrency() {
  const [currency, setCurrency] = useState<CurrencyConfig>(CURRENCY_CONFIGS.USD);
  const [loading, setLoading] = useState(true);

  const fetchOrganizationCurrency = useCallback(async () => {
    try {
      const response = await organizationApi.getSettings();
      const currencyCode = response.data.currency || 'USD';
      setCurrency(CURRENCY_CONFIGS[currencyCode] || CURRENCY_CONFIGS.USD);
    } catch (error) {
      console.error('Failed to fetch organization currency:', error);
      // Fallback to USD
      setCurrency(CURRENCY_CONFIGS.USD);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrganizationCurrency();
    
    // Listen for currency change events
    const handleCurrencyChange = (event: CustomEvent<{ currency: string }>) => {
      const newCurrency = CURRENCY_CONFIGS[event.detail.currency] || CURRENCY_CONFIGS.USD;
      setCurrency(newCurrency);
    };

    window.addEventListener('currencyChanged', handleCurrencyChange as EventListener);
    return () => window.removeEventListener('currencyChanged', handleCurrencyChange as EventListener);
  }, [fetchOrganizationCurrency]);

  const formatCurrency = useCallback((amount: number): string => {
    const { symbol, position, decimalSeparator, thousandSeparator, decimalPlaces, code } = currency;
    
    const formattedAmount = amount.toLocaleString(undefined, {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    }).replace(/,/g, thousandSeparator).replace(/\./g, decimalSeparator);
    
    const formatted = `${symbol}${formattedAmount}`;
    
    if (position === 'after') {
      return `${formattedAmount} ${symbol}`;
    }
    
    return formatted;
  }, [currency]);

  const updateCurrency = useCallback(async (newCurrencyCode: string) => {
    try {
      await organizationApi.updateSettings({ currency: newCurrencyCode });
      const newCurrency = CURRENCY_CONFIGS[newCurrencyCode] || CURRENCY_CONFIGS.USD;
      setCurrency(newCurrency);
      
      // Dispatch event for other components
      window.dispatchEvent(new CustomEvent('currencyChanged', { detail: { currency: newCurrencyCode } }));
      
      return true;
    } catch (error) {
      console.error('Failed to update currency:', error);
      return false;
    }
  }, []);

  return {
    currency,
    formatCurrency,
    updateCurrency,
    loading,
    currencies: Object.entries(CURRENCY_CONFIGS).map(([code, config]) => ({
      code,
      symbol: config.symbol,
      name: getCurrencyName(code),
    })),
  };
}

function getCurrencyName(code: string): string {
  const names: Record<string, string> = {
    USD: 'US Dollar',
    EUR: 'Euro',
    GBP: 'British Pound',
    NGN: 'Nigerian Naira',
    JPY: 'Japanese Yen',
  };
  return names[code] || code;
}