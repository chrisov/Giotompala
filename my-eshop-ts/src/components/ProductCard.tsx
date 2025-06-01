import React, { useEffect, useState, useMemo } from 'react'; // Πρόσθεσα το useMemo
import type { Product } from '../types/Product';
import styles from './ProductCard.module.css';
import { usePythPrices } from '../hooks/usePythPrices';

type Props = {
  product: Product;
  onBuyClick: (product: Product) => void;
  // Το onDiscountChange είναι στα props αλλά δεν χρησιμοποιείται μέσα στο ProductCard.
  // Αν δεν χρειάζεται, μπορείς να το αφαιρέσεις από τα Props.
  // onDiscountChange: (id: number, newDiscount: number) => void; 
};

const ProductCard: React.FC<Props> = ({ product, onBuyClick }) => { // Αφαίρεσα το onDiscountChange από τα destructuring props
  const [timeLeft, setTimeLeft] = useState<string>('00:00:00');
  const [showCryptoPrice, setShowCryptoPrice] = useState(false);
  // Φέρνουμε την τιμή του ETH/USD από το Pyth Network
  const { prices } = usePythPrices(['ETH/USD'], { autoRefresh: true, refreshInterval: 30000 });

  // Υπολογίζουμε την τιμή σε ETH μόνο όταν αλλάζει η τιμή του προϊόντος ή η τιμή του ETH/USD
  const productPriceInEth = useMemo(() => {
    const ethPriceUsd = prices['ETH/USD']?.price; // Παίρνουμε την τιμή του ETH σε USD από το Pyth
    
    if (!ethPriceUsd || ethPriceUsd === 0) {
      return null; // Δεν μπορούμε να υπολογίσουμε αν δεν υπάρχει τιμή ETH/USD
    }

    const discountedPriceUsd = product.price * (1 - (product.discountPercent || 0) / 100);
    const priceInEth = discountedPriceUsd / ethPriceUsd;
    return priceInEth.toFixed(6); // Επιστρέφουμε την τιμή σε 6 δεκαδικά ψηφία ως string
  }, [product.price, product.discountPercent, prices]); // Εξαρτήσεις: τιμή προϊόντος, έκπτωση, και Pyth τιμές


  useEffect(() => {
    const dealEndTime = product.dealEndsAt;

    if (!dealEndTime) {
      return;
    }

    const interval = setInterval(() => {
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
  }, [product.dealEndsAt]);

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
            ${(product.price * (1 - (product.discountPercent || 0) / 100)).toFixed(2)} {/* Υπολογίζουμε εδώ την εκπτωτική τιμή */}
            {productPriceInEth && ( // Τώρα το productPriceInEth είναι ορισμένο
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

        <div className={styles.progressContainer}>
          <label className={styles.progressLabel}>
            {product.purchasePercent ?? 0}% of stock purchased
          </label>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${product.purchasePercent ?? 0}%` }}
            ></div>
          </div>
        </div>

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