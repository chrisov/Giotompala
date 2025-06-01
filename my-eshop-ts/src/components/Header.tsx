import React from 'react';
import styles from './Header.module.css';
import PriceDisplay from './PriceDisplay';

interface HeaderProps {
  onSearch: (query: string) => void;
  onRegisterClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onSearch, onRegisterClick }) => {
  return (
    <>
      <header className={styles.header}>
        <div className={styles.logo}>🚀 Giotompala</div>
        <input
          type="search"
          placeholder="Search products..."
          className={styles.search}
          onChange={(e) => onSearch(e.target.value)}
        />
        <button className={styles.registerBtn} onClick={onRegisterClick}>
          Register
        </button>
      </header>
      <div className={styles.priceSection}>
        <PriceDisplay 
          symbols={['ETH/USD', 'BTC/USD', 'SOL/USD']} 
          compact={true}
          className={styles.headerPrices}
        />
      </div>
    </>
  );
};

export default Header;
