import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import ProductList from "./components/ProductList";
import { useAccount, useWriteContract } from "wagmi";
import { YourContractAbi } from "./contracts/YourContract";
import type { Product } from "./types/Product";
import "./App.module.css";

import headphonesImg from "./assets/headphones.jpg";
import watchImg from "./assets/watch.jpg";
import mouseImg from "./assets/mouse.jpg";
import speakerImg from "./assets/speaker.jpg";
import standImg from "./assets/stand.jpg";

// Konstante für Contract-Adresse → Ersetze durch echte Adresse
const YourContractAddress = "0x1234567890abcdef1234567890abcdef12345678";

const getFutureTime = (minutesFromNow: number) => {
  const now = new Date();
  now.setMinutes(now.getMinutes() + minutesFromNow);
  return now;
};

const dummyProducts: Product[] = [
  { id: 1, name: "Wireless Headphones", price: 99.99, image: headphonesImg, discountPercent: 10, dealEndsAt: getFutureTime(1441) },
  { id: 2, name: "Smart Watch", price: 149.99, image: watchImg, discountPercent: 5, dealEndsAt: getFutureTime(1441) },
  { id: 3, name: "Gaming Mouse", price: 49.99, image: mouseImg, discountPercent: 20, dealEndsAt: getFutureTime(1441) },
  { id: 4, name: "Bluetooth Speaker", price: 75.0, image: speakerImg, discountPercent: 15, dealEndsAt: getFutureTime(1441) },
  { id: 5, name: "Laptop Stand", price: 39.99, image: standImg, discountPercent: 0, dealEndsAt: getFutureTime(1441) },
];

const App: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(dummyProducts);
  const [searchQuery, setSearchQuery] = useState("");
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [statusMessage, setStatusMessage] = useState("Ready to connect and purchase.");
  const [modalMessage, setModalMessage] = useState("");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [productToBuy, setProductToBuy] = useState<Product | null>(null);

  const { address: walletAddress } = useAccount(); // ✅ Auto-Detection
  const { writeContractAsync } = useWriteContract(); // ✅ Wagmi Hook

  useEffect(() => {
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsHost = window.location.hostname;
    const wsPort = "10000";
    const backendUrl = import.meta.env.VITE_WEBSOCKET_URL || `${wsProtocol}//${wsHost}:${wsPort}`;
    const newSocket = new WebSocket(backendUrl);

    newSocket.onopen = () => {
      console.log("✅ WebSocket connected:", backendUrl);
      setStatusMessage("Connected to DApp backend.");
    };

    newSocket.onmessage = (event) => {
      const response = JSON.parse(event.data);
      if (response.status === "success") {
        setModalMessage(response.message);
        setStatusMessage(response.message);
        setTimeout(() => {
          setIsAuthModalOpen(false);
          setProductToBuy(null);
        }, 1500);
      } else {
        setModalMessage(response.message);
        setStatusMessage(response.message);
      }
    };

    newSocket.onerror = (err) => {
      console.error("WebSocket error", err);
      setStatusMessage("WebSocket error! Check console.");
    };

    newSocket.onclose = () => {
      console.log("WebSocket closed.");
      setStatusMessage("Disconnected. Please refresh.");
    };

    setSocket(newSocket);
    return () => newSocket.close();
  }, []);

  const handleDiscountChange = (id: number, newDiscount: number) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, discountPercent: newDiscount } : p)));
  };

  const handleRegisterClick = () => {
    alert("Registration flow would go here.");
  };

  const filteredProducts = products.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleBuyClick = (product: Product) => {
    setProductToBuy(product);
    setIsAuthModalOpen(true);
    setModalMessage("");
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setProductToBuy(null);
  };

  const attemptWalletLogin = async () => {
    if (!walletAddress || !productToBuy) {
      setModalMessage("Bitte Wallet verbinden und Produkt wählen.");
      return;
    }

    try {
      const tx = await writeContractAsync({
        address: YourContractAddress,
        abi: YourContractAbi,
        functionName: "participate",
        args: [walletAddress],
      });

      if (socket && socket.readyState === WebSocket.OPEN) {
        const ethAmount = productToBuy.price * (1 - productToBuy.discountPercent / 100) / 1000;
        socket.send(JSON.stringify({
          type: "record_purchase",
          walletAddress,
          product: productToBuy.name,
          amount: parseFloat(ethAmount.toFixed(4)),
        }));
      }

      setModalMessage(`✅ TX gesendet: ${tx.hash}`);
      setStatusMessage("Kauf erfolgreich.");
    } catch (err: any) {
      console.error(err);
      setModalMessage("Fehler bei der Transaktion.");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", width: "100vw" }}>
      <Header onSearch={setSearchQuery} onRegisterClick={handleRegisterClick} />
      <main style={{ flex: 1, padding: "1rem 2rem", overflowY: "auto" }}>
        <div id="statusMessage" style={{ padding: "10px", backgroundColor: "#e0e0e0", marginBottom: "20px", textAlign: "center", borderRadius: "8px", display: statusMessage ? "block" : "none" }}>
          {statusMessage}
        </div>

        <ProductList products={filteredProducts} onBuyClick={handleBuyClick} onDiscountChange={handleDiscountChange} />
      </main>

      {isAuthModalOpen && productToBuy && (
        <div style={{
          position: "fixed",
          zIndex: 1000,
          left: 0,
          top: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0,0,0,0.4)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}>
          <div style={{
            backgroundColor: "#fefefe",
            padding: "20px",
            border: "1px solid #888",
            borderRadius: "8px",
            width: "80%",
            maxWidth: "400px",
            textAlign: "center",
            boxShadow: "0 4px 8px rgba(0,0,0,0.2)"
          }}>
            <h2>Wallet verbinden für {productToBuy.name}</h2>
            <p>Verbunden: <b>{walletAddress}</b></p>
            {modalMessage && <p style={{ color: "red", marginTop: "10px" }}>{modalMessage}</p>}
            <button onClick={attemptWalletLogin} style={{ backgroundColor: "#28a745", color: "white", padding: "10px 15px", border: "none", borderRadius: "5px", cursor: "pointer", margin: "5px" }}>
              Buy & Participate
            </button>
            <button onClick={closeAuthModal} style={{ backgroundColor: "#6c757d", color: "white", padding: "10px 15px", border: "none", borderRadius: "5px", cursor: "pointer", margin: "5px" }}>
              Abbrechen
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
