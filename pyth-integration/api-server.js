require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
const { HermesClient } = require('@pythnetwork/hermes-client');

const app = express();
const PORT = process.env.API_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Pyth Contract ABI
const PYTH_ABI = [
    "function updatePriceFeeds(bytes[] calldata updateData) external payable",
    "function getPriceNoOlderThan(bytes32 id, uint256 age) external view returns (int64 price, uint64 conf, int32 expo, uint256 publishTime)",
    "function getPrice(bytes32 id) external view returns (int64 price, uint64 conf, int32 expo, uint256 publishTime)",
    "function getUpdateFee(bytes[] calldata updateData) external view returns (uint256 feeAmount)",
    "function getValidTimePeriod() external view returns (uint256 validTimePeriod)"
];

class PythAPIServer {
    constructor() {
        // Blockchain setup
        this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
        this.pythContract = new ethers.Contract(
            process.env.PYTH_CONTRACT_ADDRESS, 
            PYTH_ABI, 
            this.wallet
        );
        this.hermesClient = new HermesClient("https://hermes.pyth.network");
        
        // Price feed IDs
        this.priceFeeds = {
            ETH_USD: '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
            BTC_USD: '0xe62df6c8b4c85672d1c1b6b8b4b5c5d5f1a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5',
            SOL_USD: '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d4',
            USDC_USD: '0xeaa020c61cc479712813461ce153894a96a6c1f1001ee01c12a3a9a77d5bfb9f'
        };
        
        console.log("🚀 Pyth API Server initialized");
        console.log("👛 Wallet:", this.wallet.address);
        console.log("📍 Pyth Contract:", process.env.PYTH_CONTRACT_ADDRESS);
    }

    getFeedName(feedId) {
        const feeds = {
            [this.priceFeeds.ETH_USD]: 'ETH_USD',
            [this.priceFeeds.BTC_USD]: 'BTC_USD',
            [this.priceFeeds.SOL_USD]: 'SOL_USD',
            [this.priceFeeds.USDC_USD]: 'USDC_USD'
        };
        return feeds[feedId] || 'UNKNOWN';
    }

    // =================================================================
    // STEP 1: PULL/FETCH DATA FROM HERMES API
    // =================================================================
    
    async step1_pullFromHermes(feedIds) {
        console.log("\n📡 STEP 1: Pull/Fetch data from Hermes");
        
        try {
            const priceUpdates = await this.hermesClient.getLatestPriceUpdates(feedIds);
            const prices = {};
            
            priceUpdates.parsed.forEach((priceData, index) => {
                const feedId = feedIds[index];
                const feedName = this.getFeedName(feedId);
                const price = Number(priceData.price.price) * Math.pow(10, priceData.price.expo);
                const publishTime = new Date(priceData.price.publish_time * 1000);
                const ageSeconds = (Date.now() - publishTime.getTime()) / 1000;
                
                prices[feedName] = {
                    price: price,
                    confidence: Number(priceData.price.conf) * Math.pow(10, priceData.price.expo),
                    publishTime: publishTime,
                    ageSeconds: ageSeconds,
                    feedId: feedId,
                    expo: priceData.price.expo
                };
                
                console.log(`💰 ${feedName}: $${price.toFixed(2)} (${ageSeconds.toFixed(1)}s old)`);
            });
            
            return {
                success: true,
                step: 1,
                description: "Fetch from Hermes API",
                prices: prices,
                updateData: priceUpdates.binary.data.map(data => '0x' + data),
                timestamp: Date.now()
            };
            
        } catch (error) {
            console.error("❌ Hermes fetch failed:", error.message);
            throw error;
        }
    }

    // =================================================================
    // STEP 2: UPDATE ON-CHAIN USING updatePriceFeeds
    // =================================================================
    
    async step2_updateOnChain(updateData) {
        console.log("\n⛓️  STEP 2: Update on-chain using updatePriceFeeds");
        
        try {
            // Calculate update fee
            const updateFee = await this.pythContract.getUpdateFee(updateData);
            console.log(`💸 Update Fee: ${ethers.formatEther(updateFee)} ETH`);
            
            // Check wallet balance
            const balance = await this.provider.getBalance(this.wallet.address);
            if (updateFee > balance) {
                throw new Error(`Insufficient ETH balance. Need: ${ethers.formatEther(updateFee)} ETH, Have: ${ethers.formatEther(balance)} ETH`);
            }
            
            // Send update transaction
            const tx = await this.pythContract.updatePriceFeeds(updateData, {
                value: updateFee,
                gasLimit: 500000
            });
            
            console.log(`📤 Transaction sent: ${tx.hash}`);
            
            // Wait for confirmation
            const receipt = await tx.wait();
            console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
            
            return {
                success: true,
                step: 2,
                description: "Update on-chain price feeds",
                transactionHash: tx.hash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed.toString(),
                updateFee: ethers.formatEther(updateFee),
                timestamp: Date.now()
            };
            
        } catch (error) {
            console.error("❌ On-chain update failed:", error.message);
            throw error;
        }
    }

    // =================================================================
    // STEP 3: CONSUME PRICE DATA
    // =================================================================
    
    async step3_consumePrice(feedId, maxAge = 300) {
        console.log("\n📊 STEP 3: Consume price data from contract");
        
        try {
            const feedName = this.getFeedName(feedId);
            console.log(`🔍 Reading ${feedName} price from contract...`);
            
            // Get price with age check
            const priceData = await this.pythContract.getPriceNoOlderThan(feedId, maxAge);
            const [price, conf, expo, publishTime] = priceData;
            
            const formattedPrice = Number(price) * Math.pow(10, Number(expo));
            const confidence = Number(conf) * Math.pow(10, Number(expo));
            const priceAge = Math.floor(Date.now() / 1000) - Number(publishTime);
            
            console.log(`💰 ${feedName}: $${formattedPrice.toFixed(2)}`);
            console.log(`📈 Confidence: ±$${confidence.toFixed(2)}`);
            console.log(`⏰ Age: ${priceAge} seconds`);
            
            return {
                success: true,
                step: 3,
                description: "Consume on-chain price data",
                feedName: feedName,
                price: formattedPrice,
                confidence: confidence,
                publishTime: Number(publishTime),
                ageSeconds: priceAge,
                maxAge: maxAge,
                timestamp: Date.now()
            };
            
        } catch (error) {
            console.error("❌ Price consumption failed:", error.message);
            throw error;
        }
    }

    // =================================================================
    // STEP 4: PRICE PUSHER SIMULATION
    // =================================================================
    
    async step4_pricePusher(feedIds, intervalSeconds = 60) {
        console.log("\n🔄 STEP 4: Price Pusher (Automated Updates)");
        
        const results = [];
        
        try {
            for (let i = 0; i < 3; i++) { // Simulate 3 updates
                console.log(`\n📡 Price Push #${i + 1}`);
                
                // Step 1: Fetch fresh data
                const step1Result = await this.step1_pullFromHermes(feedIds);
                
                // Step 2: Update on-chain
                const step2Result = await this.step2_updateOnChain(step1Result.updateData);
                
                // Step 3: Verify consumption
                const step3Results = [];
                for (const feedId of feedIds) {
                    const step3Result = await this.step3_consumePrice(feedId);
                    step3Results.push(step3Result);
                }
                
                results.push({
                    pushNumber: i + 1,
                    hermesFetch: step1Result,
                    onChainUpdate: step2Result,
                    priceConsumption: step3Results,
                    timestamp: Date.now()
                });
                
                if (i < 2) { // Don't wait after last iteration
                    console.log(`⏳ Waiting ${intervalSeconds} seconds before next update...`);
                    await new Promise(resolve => setTimeout(resolve, intervalSeconds * 1000));
                }
            }
            
            return {
                success: true,
                step: 4,
                description: "Automated price pusher",
                totalUpdates: results.length,
                results: results,
                timestamp: Date.now()
            };
            
        } catch (error) {
            console.error("❌ Price pusher failed:", error.message);
            throw error;
        }
    }
}

// Initialize Pyth API Server
const pythAPI = new PythAPIServer();

// =================================================================
// API ENDPOINTS
// =================================================================

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: Date.now(),
        wallet: pythAPI.wallet.address,
        contract: process.env.PYTH_CONTRACT_ADDRESS
    });
});

// Get available price feeds
app.get('/feeds', (req, res) => {
    res.json({
        feeds: pythAPI.priceFeeds,
        timestamp: Date.now()
    });
});

// STEP 1: Fetch from Hermes
app.post('/step1/hermes', async (req, res) => {
    try {
        const { feedIds } = req.body;
        const feeds = feedIds || [pythAPI.priceFeeds.ETH_USD];
        
        const result = await pythAPI.step1_pullFromHermes(feeds);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            step: 1,
            timestamp: Date.now()
        });
    }
});

// STEP 2: Update on-chain
app.post('/step2/update', async (req, res) => {
    try {
        const { updateData } = req.body;
        
        if (!updateData || !Array.isArray(updateData)) {
            return res.status(400).json({
                success: false,
                error: "updateData array is required",
                step: 2,
                timestamp: Date.now()
            });
        }
        
        const result = await pythAPI.step2_updateOnChain(updateData);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            step: 2,
            timestamp: Date.now()
        });
    }
});

// STEP 3: Consume price
app.get('/step3/consume/:feedId', async (req, res) => {
    try {
        const { feedId } = req.params;
        const { maxAge } = req.query;
        
        const result = await pythAPI.step3_consumePrice(feedId, maxAge ? parseInt(maxAge) : 300);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            step: 3,
            timestamp: Date.now()
        });
    }
});

// STEP 4: Price pusher
app.post('/step4/pusher', async (req, res) => {
    try {
        const { feedIds, intervalSeconds } = req.body;
        const feeds = feedIds || [pythAPI.priceFeeds.ETH_USD];
        const interval = intervalSeconds || 60;
        
        const result = await pythAPI.step4_pricePusher(feeds, interval);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            step: 4,
            timestamp: Date.now()
        });
    }
});

// Combined workflow: All 4 steps in sequence
app.post('/workflow/complete', async (req, res) => {
    try {
        const { feedIds } = req.body;
        const feeds = feedIds || [pythAPI.priceFeeds.ETH_USD];
        
        console.log("\n🚀 COMPLETE PYTH WORKFLOW");
        console.log("=".repeat(50));
        
        // Step 1: Fetch from Hermes
        const step1Result = await pythAPI.step1_pullFromHermes(feeds);
        
        // Step 2: Update on-chain
        const step2Result = await pythAPI.step2_updateOnChain(step1Result.updateData);
        
        // Step 3: Consume prices
        const step3Results = [];
        for (const feedId of feeds) {
            const step3Result = await pythAPI.step3_consumePrice(feedId);
            step3Results.push(step3Result);
        }
        
        const result = {
            success: true,
            description: "Complete Pyth Oracle workflow",
            steps: {
                step1_hermes: step1Result,
                step2_update: step2Result,
                step3_consume: step3Results
            },
            timestamp: Date.now()
        };
        
        console.log("\n✅ Complete workflow finished successfully!");
        res.json(result);
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            description: "Complete Pyth Oracle workflow failed",
            timestamp: Date.now()
        });
    }
});

// Get wallet info
app.get('/wallet', async (req, res) => {
    try {
        const balance = await pythAPI.provider.getBalance(pythAPI.wallet.address);
        const network = await pythAPI.provider.getNetwork();
        
        res.json({
            address: pythAPI.wallet.address,
            balance: ethers.formatEther(balance),
            network: {
                name: network.name,
                chainId: network.chainId.toString()
            },
            timestamp: Date.now()
        });
    } catch (error) {
        res.status(500).json({
            error: error.message,
            timestamp: Date.now()
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🌐 Pyth API Server running on http://localhost:${PORT}`);
    console.log("\n📋 Available endpoints:");
    console.log("   GET  /health               - Health check");
    console.log("   GET  /feeds                - Available price feeds");
    console.log("   GET  /wallet               - Wallet information");
    console.log("   POST /step1/hermes         - Step 1: Fetch from Hermes");
    console.log("   POST /step2/update         - Step 2: Update on-chain");
    console.log("   GET  /step3/consume/:feedId - Step 3: Consume price");
    console.log("   POST /step4/pusher         - Step 4: Price pusher");
    console.log("   POST /workflow/complete    - Complete 4-step workflow");
    console.log("\n🔗 Example API calls:");
    console.log(`   curl http://localhost:${PORT}/health`);
    console.log(`   curl -X POST http://localhost:${PORT}/workflow/complete -H "Content-Type: application/json" -d '{"feedIds":["0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace"]}'`);
});

module.exports = app;
