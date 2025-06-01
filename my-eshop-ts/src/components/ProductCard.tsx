import React, { useEffect, useState } from 'react';
import type { Product } from '../types/Product';
import styles from './ProductCard.module.css';

type Props = {
  product: Product;
  onBuyClick: (product: Product) => void;
  onDiscountChange: (id: number, newDiscount: number) => void;
};

const ProductCard: React.FC<Props> = ({ product, onBuyClick, onDiscountChange }) => {
  const [timeLeft, setTimeLeft] = useState<string>('00:00:00');

  useEffect(() => {
    // Δημιουργούμε μια τοπική μεταβλητή για το dealEndsAt
    const dealEndTime = product.dealEndsAt;

    if (!dealEndTime) { // Ελέγχουμε αυτή την τοπική μεταβλητή
      return;
    }

    const interval = setInterval(() => {
      // Τώρα, μέσα σε αυτό το block, ο TypeScript ξέρει ότι το dealEndTime είναι τύπου Date
      const total = dealEndTime.getTime() - new Date().getTime();
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
  }, [product.dealEndsAt]); // Εξακολουθείς να βάζεις το product.dealEndsAt στο dependency array

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

        <p className={styles.price}>${product.price.toFixed(2)}</p>

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