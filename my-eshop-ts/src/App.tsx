import React, { useState } from 'react';
import Header from './components/Header';
import ProductList from './components/ProductList';
import BuyModal from './components/BuyModal';
import type { Product } from './types/Product';
import styles from './App.module.css';

import headphonesImg from './assets/headphones.jpg';
import watchImg from './assets/watch.jpg';
import mouseImg from './assets/mouse.jpg';
import speakerImg from './assets/speaker.jpg';
import standImg from './assets/stand.jpg';

const getFutureTime = (minutesFromNow: number) => {
  const now = new Date();
  now.setMinutes(now.getMinutes() + minutesFromNow);
  return now;
};

const dummyProducts: Product[] = [
  {
    id: 1,
    name: 'Wireless Headphones',
    price: 99.99,
    image: headphonesImg,
    discountPercent: 10,
    dealEndsAt: getFutureTime(1441),
  },
  {
    id: 2,
    name: 'Smart Watch',
    price: 149.99,
    image: watchImg,
    discountPercent: 5,
    dealEndsAt: getFutureTime(1441),
  },
  {
    id: 3,
    name: 'Gaming Mouse',
    price: 49.99,
    image: mouseImg,
    discountPercent: 20,
    dealEndsAt: getFutureTime(1441),
  },
  {
    id: 4,
    name: 'Bluetooth Speaker',
    price: 75.0,
    image: speakerImg,
    discountPercent: 15,
    dealEndsAt: getFutureTime(1441),
  },
  {
    id: 5,
    name: 'Laptop Stand',
    price: 39.99,
    image: standImg,
    discountPercent: 0,
    dealEndsAt: getFutureTime(1441),
  },
];

const App: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(dummyProducts);
  const [buyingProduct, setBuyingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleBuyClick = (product: Product) => {
    setBuyingProduct(product);
  };

  const handleDiscountChange = (id: number, newDiscount: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, discountPercent: newDiscount } : p))
    );
  };

  const handlePurchase = (product: Product, name: string, card: string) => {
    alert(
      `Thank you, ${name}! You purchased ${product.name} with card ending ${card.slice(-4)}.`
    );
    setBuyingProduct(null);
  };

  const handleRegisterClick = () => {
    alert('Registration flow would go here.');
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
      }}
    >
      <Header onSearch={setSearchQuery} onRegisterClick={handleRegisterClick} />
      <main
        style={{
          flex: 1,
          padding: '1rem 2rem',
          overflowY: 'auto',
        }}
      >
        <ProductList
          products={filteredProducts}
          onBuyClick={handleBuyClick}
          onDiscountChange={handleDiscountChange}
        />
      </main>
      {buyingProduct && (
        <BuyModal
          product={buyingProduct}
          onClose={() => setBuyingProduct(null)}
          onPurchase={handlePurchase}
        />
      )}
    </div>
  );
};

export default App;
