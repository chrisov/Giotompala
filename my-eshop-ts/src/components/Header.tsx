import React from 'react';
import styles from './Header.module.css';

interface HeaderProps {
  onSearch: (query: string) => void;
  onRegisterClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onSearch, onRegisterClick }) => {
  return (
    <header className={styles.header}>
      <div className={styles.logo}>eShopLogo</div>
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
  );
};

export default Header;
