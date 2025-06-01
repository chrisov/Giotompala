// src/types/Product.ts
export type Product = {
  id: number;
  name: string;
  price: number;
  image: string;
  discountPercent: number;
  dealEndsAt?: Date; // Εδώ είναι η αλλαγή: προσθέτουμε το ερωτηματικό (?)
};