import React, { useEffect, useState } from 'react';
import type { Product } from '../types/Product';
import styles from './ProductCard.module.css';

type Props = {
  product: Product;
  onBuyClick: (product: Product) => void;
  onDiscountChange: (id: number, newDiscount: number) => void;
};

const ProductCard: React.FC<Props> = ({ product, onBuyClick, onDiscountChange }) => {
  const [timeLeft, setTimeLeft] = useState('00:00:00');

  useEffect(() => {
    if (!product.dealEndsAt) return;

    const interval = setInterval(() => {
      const total = product.dealEndsAt!.getTime() - new Date().getTime();
      if (total <= 0) {
        setTimeLeft('00:00:00');
        clearInterval(interval);
        return;
      }

      const hours = Math.floor(total / (1000 * 60 * 60));
      const minutes = Math.floor((total / (1000 * 60)) % 60);
      const seconds = Math.floor((total / 1000) % 60);

      setTimeLeft([hours, minutes, seconds].map(u => String(u).padStart(2, '0')).join(':'));
    }, 1000);

    return () => clearInterval(interval);
  }, [product.dealEndsAt]);

  return (
    <div className={styles.card}>
      {/* Left: Image */}
      <img src={product.image} alt={product.name} className={styles.image} />

      {/* Middle: Name */}
      <div className={styles.name}>
        <h3>{product.name}</h3>
      </div>

      {/* Right: Timer and Buy button */}
      <div className={styles.rightSection}>
        {product.dealEndsAt && (
          <div className={styles.timer}>
            ⏳ Deal ends in: <strong>{timeLeft}</strong>
          </div>
        )}

        <button onClick={() => onBuyClick(product)} className={styles.buyButton}>
          Buy
        </button>
      </div>

      {/* Full width discount bar */}
      <div className={styles.discountBarContainer}>
        <input
          type="range"
          min="0"
          max="100"
          value={product.discountPercent}
          onChange={(e) => onDiscountChange(product.id, parseInt(e.target.value))}
          className={styles.discountSlider}
        />
        <span className={styles.discountLabel}>{product.discountPercent}%</span>
      </div>
    </div>
  );
};

export default ProductCard;
