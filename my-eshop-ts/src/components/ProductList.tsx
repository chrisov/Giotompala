// src/components/ProductList.tsx
import React from 'react';
import ProductCard from './ProductCard';
import type { Product } from '../types/Product';

interface ProductListProps {
  products: Product[];
  onBuyClick: (product: Product) => void;
  onDiscountChange: (id: number, newDiscount: number) => void;
}

const ProductList: React.FC<ProductListProps> = ({ products, onBuyClick, onDiscountChange }) => {
	return (
	  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
		{products.map((product) => (
		  <ProductCard
			key={product.id}
			product={product}
			onBuyClick={onBuyClick}
			onDiscountChange={onDiscountChange}
		  />
		))}
	  </div>
	);
  };
  

export default ProductList;
