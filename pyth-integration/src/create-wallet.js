const { ethers } = require('ethers');

// Neue Wallet erstellen
const wallet = ethers.Wallet.createRandom();

console.log("🆕 New Testnet Wallet Created:");
console.log("📍 Address:", wallet.address);
console.log("🔑 Private Key:", wallet.privateKey);
console.log("📝 Mnemonic:", wallet.mnemonic.phrase);
console.log("");
console.log("⚠️  IMPORTANT: Save these details securely!");
console.log("💡 Use this wallet ONLY for testing!");
console.log("");
console.log("📋 Next steps:");
console.log("1. Copy the Private Key to your .env file");
console.log("2. Get free ETH from: https://sepoliafaucet.com/");
console.log("3. Use this address:", wallet.address);