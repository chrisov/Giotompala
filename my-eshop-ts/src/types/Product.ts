// C:\Users\Eleni\Desktop\FrontEnd\my-eshop-ts\src\types\Product.ts

export type Product = {
  id: number;
  name: string;
  price: number;
  image: string;
  discountPercent: number; // <--- Πρόσθεσε αυτή τη γραμμή
  dealEndsAt?: Date; // Είδα ότι το χρησιμοποιείς, οπότε βεβαιώσου ότι υπάρχει και είναι optional
  purchasePercent?: number; // Είδα ότι το χρησιμοποιείς, οπότε βεβαιώσου ότι υπάρχει και είναι optional
};