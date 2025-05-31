import axios from "axios";
import * as dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.ONEINCH_API_KEY!;
const CHAIN_ID = 42161; // Arbitrum Mainnet

const URL = `https://api.1inch.dev/swap/v5.2/${CHAIN_ID}/swap`;

async function main() {
  const params = {
    fromTokenAddress: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", // Native ETH
    toTokenAddress: "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8",   // USDC (Arbitrum)
    amount: "20000000000000000", // 0.01 ETH in wei
    fromAddress: "0x4D163161d6e79E9F2B8C20be4bbA5970c7Ad02D5", // Replace with your wallet
    slippage: 1,
    disableEstimate: true
  };

  const headers = {
    Authorization: `Bearer ${API_KEY}`
  };

  try {
    const response = await axios.get(URL, { params, headers });
    console.log("✅ Swap Data:", response.data);
  } catch (error: any) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
}

main();
