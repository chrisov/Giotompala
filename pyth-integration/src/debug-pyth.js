require('dotenv').config();
const { ethers } = require('ethers');
const { HermesClient } = require('@pythnetwork/hermes-client');

const ETH_USD_PRICE_FEED_ID = '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace';

const PYTH_ABI = [
    "function updatePriceFeeds(bytes[] calldata updateData) external payable",
    "function getPriceNoOlderThan(bytes32 id, uint256 age) external view returns (int64 price, uint64 conf, int32 expo, uint256 publishTime)",
    "function getPrice(bytes32 id) external view returns (int64 price, uint64 conf, int32 expo, uint256 publishTime)",
    "function getUpdateFee(bytes[] calldata updateData) external view returns (uint256 feeAmount)",
    "function getValidTimePeriod() external view returns (uint256 validTimePeriod)",
    "function parsePriceFeedUpdates(bytes[] calldata updateData, bytes32[] calldata priceIds, uint64 minPublishTime, uint64 maxPublishTime) external payable returns (tuple(bytes32 id, int64 price, uint64 conf, int32 expo, uint256 publishTime)[] priceFeeds)"
];

class DebugPythIntegration {
    constructor() {
        this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
        this.pythContract = new ethers.Contract(process.env.PYTH_CONTRACT_ADDRESS, PYTH_ABI, this.wallet);
        this.hermesClient = new HermesClient("https://hermes.pyth.network");
        
        console.log("🔍 DEBUG Pyth Integration initialized");
        console.log("👛 Wallet:", this.wallet.address);
        console.log("📍 Contract:", process.env.PYTH_CONTRACT_ADDRESS);
    }

    // Detaillierte Diagnose
    async fullDiagnosis() {
        console.log("\n🔍 FULL SYSTEM DIAGNOSIS");
        console.log("=".repeat(50));
        
        try {
            // 1. Network Check
            const network = await this.provider.getNetwork();
            console.log(`🌐 Network: ${network.name} (Chain ID: ${network.chainId})`);
            
            if (network.chainId.toString() !== "11155111") {
                console.log("❌ WRONG NETWORK! Expected Sepolia (11155111)");
                return;
            }
            
            // 2. Balance Check
            const balance = await this.provider.getBalance(this.wallet.address);
            console.log(`💰 ETH Balance: ${ethers.formatEther(balance)} ETH`);
            
            // 3. Contract Check
            const code = await this.provider.getCode(process.env.PYTH_CONTRACT_ADDRESS);
            if (code === '0x') {
                console.log("❌ CONTRACT NOT FOUND! Invalid address or wrong network");
                return;
            }
            console.log("✅ Pyth contract found");
            
            // 4. Hermes Test
            console.log("\n📡 Testing Hermes connection...");
            const priceUpdates = await this.hermesClient.getLatestPriceUpdates([ETH_USD_PRICE_FEED_ID]);
            const ethPrice = priceUpdates.parsed[0];
            const price = Number(ethPrice.price.price) * Math.pow(10, ethPrice.price.expo);
            const publishTime = new Date(ethPrice.price.publish_time * 1000);
            const ageSeconds = (Date.now() - publishTime.getTime()) / 1000;
            
            console.log(`💰 ETH Price: $${price.toFixed(2)}`);
            console.log(`⏰ Publish Time: ${publishTime.toISOString()}`);
            console.log(`📊 Age: ${ageSeconds.toFixed(1)} seconds`);
            
            // 5. Contract Valid Time Period
            try {
                const validTimePeriod = await this.pythContract.getValidTimePeriod();
                console.log(`⏳ Valid Time Period: ${validTimePeriod.toString()} seconds`);
                
                if (ageSeconds > Number(validTimePeriod)) {
                    console.log("❌ PRICE TOO OLD! Age exceeds valid time period");
                    console.log(`   Price age: ${ageSeconds.toFixed(1)}s > Valid period: ${validTimePeriod}s`);
                }
            } catch (error) {
                console.log("⚠️  Could not get valid time period");
            }
            
            // 6. Update Data Format Check
            console.log("\n🔍 Checking update data format...");
            const updateData = priceUpdates.binary.data.map(data => '0x' + data);
            console.log(`📊 Update data length: ${updateData.length}`);
            console.log(`📊 First update data: ${updateData[0].slice(0, 20)}...`);
            
            // 7. Update Fee Check
            try {
                const updateFee = await this.pythContract.getUpdateFee(updateData);
                console.log(`💸 Update Fee: ${ethers.formatEther(updateFee)} ETH`);
                
                if (updateFee > balance) {
                    console.log("❌ INSUFFICIENT ETH for update fee");
                }
            } catch (error) {
                console.log("❌ Could not calculate update fee:", error.message);
            }
            
            // 8. Try to parse update data
            console.log("\n🔍 Testing update data parsing...");
            try {
                // Test mit aktueller Zeit
                const now = Math.floor(Date.now() / 1000);
                const minTime = now - 300; // 5 minutes ago
                const maxTime = now + 300; // 5 minutes future
                
                const result = await this.pythContract.parsePriceFeedUpdates.staticCall(
                    updateData,
                    [ETH_USD_PRICE_FEED_ID],
                    minTime,
                    maxTime,
                    { value: 0 }
                );
                
                console.log("✅ Update data is valid and parseable");
                console.log(`📊 Parsed price: ${result[0].price.toString()}`);
                
            } catch (error) {
                console.log("❌ Update data parsing failed:", error.message);
                console.log("💡 This might be why updatePriceFeeds fails");
                
                // Try different time ranges
                console.log("\n🔍 Trying different time ranges...");
                const publishTimeUnix = Math.floor(publishTime.getTime() / 1000);
                
                try {
                    const result2 = await this.pythContract.parsePriceFeedUpdates.staticCall(
                        updateData,
                        [ETH_USD_PRICE_FEED_ID],
                        publishTimeUnix - 60,
                        publishTimeUnix + 60,
                        { value: 0 }
                    );
                    console.log("✅ Update data valid with price-specific time range");
                } catch (error2) {
                    console.log("❌ Still failing with price-specific time range");
                }
            }
            
            return {
                network: network.chainId.toString(),
                balance: ethers.formatEther(balance),
                priceAge: ageSeconds,
                updateDataLength: updateData.length
            };
            
        } catch (error) {
            console.error("❌ Diagnosis failed:", error.message);
        }
    }

    // Alternative Update-Methode
    async alternativeUpdate() {
        console.log("\n🔄 TRYING ALTERNATIVE UPDATE METHOD");
        console.log("=".repeat(50));
        
        try {
            // Hole ganz frische Daten
            let attempts = 0;
            let freshData;
            
            while (attempts < 5) {
                console.log(`🔄 Attempt ${attempts + 1}: Getting fresh data...`);
                
                freshData = await this.hermesClient.getLatestPriceUpdates([ETH_USD_PRICE_FEED_ID]);
                const publishTime = new Date(freshData.parsed[0].price.publish_time * 1000);
                const ageSeconds = (Date.now() - publishTime.getTime()) / 1000;
                
                console.log(`📊 Data age: ${ageSeconds.toFixed(1)} seconds`);
                
                if (ageSeconds < 10) { // Sehr frisch
                    console.log("✅ Got very fresh data!");
                    break;
                }
                
                attempts++;
                await new Promise(resolve => setTimeout(resolve, 3000)); // 3 seconds wait
            }
            
            const updateData = freshData.binary.data.map(data => '0x' + data);
            const updateFee = await this.pythContract.getUpdateFee(updateData);
            
            console.log(`💸 Update Fee: ${ethers.formatEther(updateFee)} ETH`);
            
            // Versuche Update mit niedrigem Gas
            console.log("🚀 Trying updatePriceFeeds with conservative settings...");
            
            const gasPrice = await this.provider.getFeeData().then(fees => fees.gasPrice);
            
            const tx = await this.pythContract.updatePriceFeeds(updateData, {
                value: updateFee,
                gasLimit: 300000, // Niedrigeres Gas Limit
                gasPrice: gasPrice,
                maxFeePerGas: gasPrice,
                maxPriorityFeePerGas: gasPrice / 10n
            });
            
            console.log(`🔗 Transaction: ${tx.hash}`);
            const receipt = await tx.wait();
            
            if (receipt.status === 1) {
                console.log("🎉 SUCCESS! Alternative method worked!");
                console.log(`📦 Block: ${receipt.blockNumber}`);
                return receipt;
            } else {
                console.log("❌ Alternative method also failed");
            }
            
        } catch (error) {
            console.error("❌ Alternative update failed:", error.message);
        }
    }

    async runFullDebug() {
        await this.fullDiagnosis();
        await this.alternativeUpdate();
    }
}

// Main execution
async function main() {
    const debug = new DebugPythIntegration();
    await debug.runFullDebug();
}

if (require.main === module) {
    main().catch(console.error);
}