import React, { useState } from 'react';
import styles from './BuyModal.module.css';
import type { Product } from '../types/Product';

interface BuyModalProps {
  product: Product | null;
  onClose: () => void;
  onPurchase: (product: Product, name: string, card: string) => void;
}

const BuyModal: React.FC<BuyModalProps> = ({ product, onClose, onPurchase }) => {
  const [name, setName] = useState('');
  const [card, setCard] = useState('');

  if (!product) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onPurchase(product, name, card);
  };

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.modal}>
        <h2>Buy {product.name}</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <label>
            Name:
            <input
              type="text"
              value={name}
              required
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label>
            Card Number:
            <input
              type="text"
              value={card}
              required
              onChange={(e) => setCard(e.target.value)}
              maxLength={16}
              pattern="\d{16}"
              title="Please enter a 16-digit card number"
            />
          </label>
          <div className={styles.buttons}>
            <button type="submit" className={styles.submitBtn}>
              Confirm Purchase
            </button>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default BuyModal;
