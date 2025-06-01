import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ProductList from './components/ProductList';
// import BuyModal from './components/BuyModal'; // Το BuyModal δεν χρειάζεται πλέον, καθώς η λογική αγοράς μεταφέρεται στο AuthModal
import type { Product } from './types/Product';
import styles from './App.module.css'; // Διατηρούμε τα styles αν χρησιμοποιούνται

// Εικόνες προϊόντων
import headphonesImg from './assets/headphones.jpg';
import watchImg from './assets/watch.jpg';
import mouseImg from './assets/mouse.jpg';
import speakerImg from './assets/speaker.jpg';
import standImg from './assets/stand.jpg';

// Δηλώνουμε την ύπαρξη του window.ethereum για TypeScript
declare global {
  interface Window {
    ethereum?: any; // Μπορείς να βάλεις πιο συγκεκριμένο type αν θες
  }
}

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
  // State από το αρχικό App.tsx
  const [products, setProducts] = useState<Product[]>(dummyProducts);
  const [searchQuery, setSearchQuery] = useState('');

  // State από τον κώδικα του index.html (για WebSocket και Modal)
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('Ready to connect and purchase.');
  const [modalMessage, setModalMessage] = useState<string>('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [walletAddressInput, setWalletAddressInput] = useState<string>('');
  const [productToBuy, setProductToBuy] = useState<Product | null>(null); // Τώρα αποθηκεύουμε ολόκληρο το Product

  // Effect για τη σύνδεση του WebSocket
  useEffect(() => {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // ΣΗΜΑΝΤΙΚΟ: Κατά το development, το React app τρέχει σε διαφορετικό port (π.χ. 5173).
    // Ο server σου τρέχει στο 10000. Πρέπει να συνδεθείς απευθείας σε αυτό το port.
    const backendPort = 10000; // Βεβαιώσου ότι είναι το ίδιο με το server.ts
    const newSocket = new WebSocket(`${wsProtocol}//${window.location.hostname}:${backendPort}`);
    // Ή απλά: const newSocket = new WebSocket(`ws://localhost:${backendPort}`);

    newSocket.onopen = () => {
      console.log('WebSocket connected.');
      setStatusMessage('Connected to DApp backend.');
    };

    newSocket.onmessage = (event) => {
      const response = JSON.parse(event.data);
      console.log('Message from server:', response);

      if (response.status === 'success') {
        setModalMessage(response.message);
        setStatusMessage(response.message);
        setTimeout(() => {
          setIsAuthModalOpen(false);
          setProductToBuy(null);
        }, 1500);
      } else if (response.status === 'error') {
        setModalMessage(response.message);
        setStatusMessage(response.message);
      } else {
        console.log('Unhandled response status:', response.status);
      }
    };

    newSocket.onclose = () => {
      console.log('WebSocket disconnected.');
      setStatusMessage('Disconnected from DApp backend. Please refresh.');
    };
    newSocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setStatusMessage('WebSocket error! Check console.');
    };

    setSocket(newSocket);

    // Clean up function: κλείνει το WebSocket όταν το component unmounts
    return () => {
      newSocket.close();
    };
  }, []); // Άδειο array σημαίνει ότι τρέχει μόνο μία φορά κατά το mount

  // Λογική από το αρχικό App.tsx
  const handleDiscountChange = (id: number, newDiscount: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, discountPercent: newDiscount } : p))
    );
  };

  const handleRegisterClick = () => {
    alert('Registration flow would go here.'); // Μπορείς να το αντικαταστήσεις με ένα React Modal
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Λογική για το Wallet Authentication Modal (από index.html)
  const handleBuyClick = (product: Product) => { // Τώρα παίρνει ολόκληρο το product
    setProductToBuy(product);
    setIsAuthModalOpen(true); // Show modal
    setWalletAddressInput('');
    setModalMessage('');
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false); // Hide modal
    setProductToBuy(null);
  };

  const attemptWalletLogin = async () => {
    const walletAddress = walletAddressInput.trim();
    if (!walletAddress) {
      setModalMessage('Please enter your wallet address.');
      return;
    }

    if (!productToBuy) { // Έλεγχος ότι υπάρχει προϊόν προς αγορά
        setModalMessage('No product selected for purchase.');
        return;
    }

    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const connectedAddress = accounts[0];

        if (walletAddress && connectedAddress.toLowerCase() !== walletAddress.toLowerCase()) {
          setModalMessage('MetaMask connected to a different address. Please use the entered address or connect the correct wallet.');
          return;
        }

        if (socket && socket.readyState === WebSocket.OPEN) {
          const amount = productToBuy.price * (1 - productToBuy.discountPercent / 100) / 1000; // Υπολογισμός ποσού σε ETH (π.χ. 0.05 ETH)
          // Προσοχή: Το amount είναι σε ETH, το price είναι σε USD. Πρέπει να κάνεις τη μετατροπή.
          // Έβαλα μια τυχαία διαίρεση με 1000 για να βγει μικρό νούμερο, ίσως χρειαστείς πιο ακριβή μετατροπή.
          
          socket.send(JSON.stringify({
            type: 'record_purchase',
            walletAddress: connectedAddress,
            product: productToBuy.name, // Στέλνουμε το όνομα του προϊόντος
            amount: parseFloat(amount.toFixed(4)), // Στρογγυλοποίηση για αποφυγή προβλημάτων float
          }));
          setModalMessage(`Processing purchase for ${productToBuy.name} from ${connectedAddress}...`);
          setStatusMessage(`Attempting to buy ${productToBuy.name}...`);
        } else {
          setModalMessage('WebSocket not open. Please refresh.');
        }

      } catch (error: any) {
        console.error("MetaMask connection error:", error);
        setModalMessage(`MetaMask connection failed: ${error.message || error}.`);
      }
    } else {
      // Fallback για χειροκίνητη εισαγωγή διεύθυνσης αν το MetaMask δεν είναι εγκατεστημένο
      if (socket && socket.readyState === WebSocket.OPEN) {
        const amount = productToBuy.price * (1 - productToBuy.discountPercent / 100) / 1000; // Υπολογισμός ποσού σε ETH
        socket.send(JSON.stringify({
          type: 'record_purchase',
          walletAddress: walletAddress,
          product: productToBuy.name,
          amount: parseFloat(amount.toFixed(4)),
        }));
        setModalMessage(`Processing purchase for ${productToBuy.name} from ${walletAddress}...`);
        setStatusMessage(`Attempting to buy ${productToBuy.name}...`);
      } else {
        setModalMessage('WebSocket not open. Please refresh.');
      }
    }
  };

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
        {/* Status Message Display */}
        <div 
            id="statusMessage" 
            style={{ 
                padding: '10px', 
                backgroundColor: '#e0e0e0', 
                marginBottom: '20px', 
                textAlign: 'center',
                borderRadius: '8px',
                display: statusMessage ? 'block' : 'none' // Εμφάνιση μόνο αν υπάρχει μήνυμα
            }}
        >
            {statusMessage}
        </div>

        <ProductList
          products={filteredProducts}
          onBuyClick={handleBuyClick} // Τώρα καλεί το handleBuyClick που ανοίγει το AuthModal
          onDiscountChange={handleDiscountChange}
        />
      </main>

      {/* Authentication Modal - Ενσωματωμένο JSX */}
      {isAuthModalOpen && productToBuy && ( // Εμφάνιση μόνο αν το modal είναι ανοιχτό και υπάρχει προϊόν
        <div style={{
          position: 'fixed', // Stay in place
          zIndex: 1000, // Sit on top
          left: 0,
          top: 0,
          width: '100%', // Full width
          height: '100%', // Full height
          overflow: 'auto', // Enable scroll if needed
          backgroundColor: 'rgba(0,0,0,0.4)', // Black w/ opacity
          display: 'flex', // Use flexbox for centering
          justifyContent: 'center', // Center content horizontally
          alignItems: 'center', // Center content vertically
        }}>
          <div style={{
            backgroundColor: '#fefefe',
            padding: '20px',
            border: '1px solid #888',
            borderRadius: '8px',
            width: '80%',
            maxWidth: '400px',
            textAlign: 'center',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
          }}>
            <h2>Connect Your Wallet to buy {productToBuy.name}</h2>
            <p>Please enter your wallet address to proceed:</p>
            <input
              type="text"
              id="walletAddressInput" // ID για συμβατότητα με προηγούμενο κώδικα (αν και δεν χρειάζεται για React)
              placeholder="e.g., 0x1A2b3C4d5E6f..."
              autoComplete="off"
              value={walletAddressInput}
              onChange={(e) => setWalletAddressInput(e.target.value)}
              style={{
                width: 'calc(100% - 20px)',
                padding: '10px',
                margin: '10px 0',
                border: '1px solid #ddd',
                borderRadius: '4px',
              }}
            />
            {modalMessage && <p style={{ color: 'red', marginTop: '10px' }}>{modalMessage}</p>}
            <button
              onClick={attemptWalletLogin}
              style={{
                backgroundColor: '#28a745',
                color: 'white',
                padding: '10px 15px',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                margin: '5px',
              }}
            >
              Connect & Buy
            </button>
            <button
              onClick={closeAuthModal}
              className="cancel"
              style={{
                backgroundColor: '#6c757d',
                color: 'white',
                padding: '10px 15px',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                margin: '5px',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
