import { useState, useEffect } from 'react';
import { PythPriceService, type PriceData } from '../services/pythService';

interface UsePythPricesOptions {
  refreshInterval?: number;
  autoRefresh?: boolean;
}

export const usePythPrices = (
  symbols: string[], 
  options: UsePythPricesOptions = {}
) => {
  const { refreshInterval = 30000, autoRefresh = true } = options;
  
  const [prices, setPrices] = useState<PriceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    const pythService = new PythPriceService();

    const fetchPrices = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (symbols.length === 0) {
          // Fetch all available prices
          const allPrices = await pythService.getAllPrices();
          setPrices(allPrices);
        } else {
          // Fetch specific symbols
          const pricePromises = symbols.map(symbol => pythService.getPrice(symbol));
          const results = await Promise.all(pricePromises);
          setPrices(results.filter(Boolean) as PriceData[]);
        }
        
        setLastUpdate(new Date());
      } catch (err) {
        console.error('Error fetching Pyth prices:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch prices');
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchPrices();

    // Set up auto-refresh if enabled
    let interval: NodeJS.Timeout | null = null;
    if (autoRefresh && refreshInterval > 0) {
      interval = setInterval(fetchPrices, refreshInterval);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [symbols.join(','), refreshInterval, autoRefresh]);

  const refetch = async () => {
    const pythService = new PythPriceService();
    
    try {
      setLoading(true);
      setError(null);
      
      if (symbols.length === 0) {
        const allPrices = await pythService.getAllPrices();
        setPrices(allPrices);
      } else {
        const pricePromises = symbols.map(symbol => pythService.getPrice(symbol));
        const results = await Promise.all(pricePromises);
        setPrices(results.filter(Boolean) as PriceData[]);
      }
      
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error refetching Pyth prices:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch prices');
    } finally {
      setLoading(false);
    }
  };

  return { 
    prices, 
    loading, 
    error, 
    lastUpdate,
    refetch 
  };
};
