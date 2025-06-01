require('dotenv').config();
const { ethers } = require('ethers');

async function checkBalance() {
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    const balance = await provider.getBalance(wallet.address);
    
    console.log("👛 Wallet Address:", wallet.address);
    console.log("💰 Balance:", ethers.formatEther(balance), "ETH");
    
    if (balance > ethers.parseEther("0.001")) {
        console.log("✅ Ready for transactions!");
    } else {
        console.log("❌ Need more ETH - visit https://sepoliafaucet.com/");
        console.log("📍 Your address:", wallet.address);
    }
}

checkBalance().catch(console.error);