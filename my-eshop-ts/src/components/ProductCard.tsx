import React, { useEffect, useState } from 'react';
import type { Product } from '../types/Product';
import styles from './ProductCard.module.css';
import { usePythPrices } from '../hooks/usePythPrices';

type Props = {
  product: Product;
  onBuyClick: (product: Product) => void;
  onDiscountChange: (id: number, newDiscount: number) => void;
};

const ProductCard: React.FC<Props> = ({ product, onBuyClick, onDiscountChange }) => {
  const [timeLeft, setTimeLeft] = useState<string>('00:00:00');
  const [showCryptoPrice, setShowCryptoPrice] = useState(false);
  const { prices } = usePythPrices(['ETH/USD'], { autoRefresh: true, refreshInterval: 30000 });

  useEffect(() => {
    if (!product.dealEndsAt) return;

    const interval = setInterval(() => {
      if (!product.dealEndsAt) return;
      
      const total = product.dealEndsAt.getTime() - new Date().getTime();
      if (total <= 0) {
        setTimeLeft('00:00:00');
        clearInterval(interval);
        return;
      }

      const hours = Math.floor(total / (1000 * 60 * 60));
      const minutes = Math.floor((total / (1000 * 60)) % 60);
      const seconds = Math.floor((total / 1000) % 60);

      setTimeLeft(
        [hours, minutes, seconds].map((unit) => String(unit).padStart(2, '0')).join(':')
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [product.dealEndsAt]);

  // Calculate crypto equivalent price
  const ethPrice = prices.find(p => p.symbol === 'ETH/USD')?.price;
  const productPriceInEth = ethPrice ? (product.price / ethPrice).toFixed(6) : null;

  return (
    <div className={styles.card}>
      <img src={product.image} alt={product.name} className={styles.image} />

      <div className={styles.content}>
        <div className={styles.topRow}>
          <h3 className={styles.name}>{product.name}</h3>
          {product.dealEndsAt && (
            <div className={styles.timer}>
              ⏳ {timeLeft}
            </div>
          )}
        </div>

        <div className={styles.priceSection}>
          <p className={styles.price}>
            ${product.price.toFixed(2)}
            {productPriceInEth && (
              <button 
                className={styles.cryptoToggle}
                onClick={() => setShowCryptoPrice(!showCryptoPrice)}
              >
                💰
              </button>
            )}
          </p>
          {showCryptoPrice && productPriceInEth && (
            <p className={styles.cryptoPrice}>
              ≈ {productPriceInEth} ETH
            </p>
          )}
        </div>

        <label className={styles.discount}>
          Discount: {product.discountPercent}%
          <input
            type="range"
            min="0"
            max="100"
            value={product.discountPercent}
            onChange={(e) => onDiscountChange(product.id, parseInt(e.target.value))}
          />
        </label>

        <div className={styles.buttonWrapper}>
          <button onClick={() => onBuyClick(product)} className={styles.stakeButton}>
            Stake
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
