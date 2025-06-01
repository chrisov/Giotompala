import React from 'react';
import { usePythPrices } from '../hooks/usePythPrices';
import styles from './PriceDisplay.module.css';

interface PriceDisplayProps {
  symbols?: string[];
  className?: string;
  compact?: boolean;
  showRefreshButton?: boolean;
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({ 
  symbols = [], 
  className = '',
  compact = false,
  showRefreshButton = false 
}) => {
  const { prices, loading, error, lastUpdate, refetch } = usePythPrices(symbols, {
    refreshInterval: 15000, // Refresh every 15 seconds
    autoRefresh: true
  });

  if (loading && prices.length === 0) {
    return (
      <div className={`${styles.priceContainer} ${className}`}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          Loading crypto prices...
        </div>
      </div>
    );
  }

  if (error && prices.length === 0) {
    return (
      <div className={`${styles.priceContainer} ${className}`}>
        <div className={styles.error}>
          <span>⚠️ Unable to load prices</span>
          {showRefreshButton && (
            <button onClick={refetch} className={styles.retryButton}>
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.priceContainer} ${compact ? styles.compact : ''} ${className}`}>
      {!compact && (
        <div className={styles.priceHeader}>
          <span className={styles.title}>🚀 Live Crypto Prices</span>
          {showRefreshButton && (
            <button onClick={refetch} className={styles.refreshButton} disabled={loading}>
              {loading ? '⟳' : '↻'}
            </button>
          )}
        </div>
      )}
      
      <div className={compact ? styles.compactList : styles.priceList}>
        {prices.slice(0, compact ? 3 : undefined).map((price) => (
          <div key={price.symbol} className={styles.priceItem}>
            <div className={styles.symbolSection}>
              <span className={styles.symbol}>{price.symbol}</span>
              {!compact && (
                <span className={styles.confidence}>±${price.confidence.toFixed(2)}</span>
              )}
            </div>
            <div className={styles.priceSection}>
              <span className={styles.price}>
                ${price.price.toLocaleString('en-US', { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: price.price > 1 ? 2 : 6 
                })}
              </span>
              {!compact && (
                <span className={styles.timestamp}>
                  {new Date(price.publishTime * 1000).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {lastUpdate && !compact && (
        <div className={styles.footer}>
          Last updated: {lastUpdate.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })}
        </div>
      )}
    </div>
  );
};

export default PriceDisplay;
