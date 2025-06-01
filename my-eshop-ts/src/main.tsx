// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

import { WagmiConfig, createConfig } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http } from "wagmi";
import { sepolia } from "wagmi/chains";

// Query Client für TanStack (z. B. Wagmi Hooks intern)
const queryClient = new QueryClient();

// Wagmi Config erstellen (ohne configureChains!)
const wagmiConfig = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(), // default: viem HTTP transport
  },
  ssr: false,
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <WagmiConfig config={wagmiConfig}>
        <App />
      </WagmiConfig>
    </QueryClientProvider>
  </React.StrictMode>
);
