const { HermesClient } = require('@pythnetwork/hermes-client');

async function testHermesOnly() {
    console.log("📡 STEP 1: Testing Hermes (FREE - No Gas Required)");
    console.log("=".repeat(50));
    
    // Hermes Client erstellen
    const client = new HermesClient("https://hermes.pyth.network");
    
    // ETH/USD Price Feed ID
    const ETH_USD_FEED_ID = '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace';
    
    try {
        // Preis-Daten von Hermes abrufen
        const priceData = await client.getLatestPriceUpdates([ETH_USD_FEED_ID]);
        
        console.log("✅ Successfully fetched from Hermes!");
        console.log("🔍 Raw Response:", JSON.stringify(priceData, null, 2));
        
        // Menschenlesbare Preis-Daten
        const ethPrice = priceData.parsed[0];
        const price = Number(ethPrice.price.price) * Math.pow(10, ethPrice.price.expo);
        const confidence = Number(ethPrice.price.conf) * Math.pow(10, ethPrice.price.expo);
        
        console.log("\n📊 ETH/USD Price Information:");
        console.log("🆔 Price Feed ID:", ethPrice.id);
        console.log("💰 Current Price: $" + price.toFixed(2));
        console.log("📈 Confidence: ±$" + confidence.toFixed(2));
        console.log("⏰ Publish Time:", new Date(ethPrice.price.publish_time * 1000).toISOString());
        
        // EMA Preis (Exponential Moving Average)
        const emaPrice = Number(ethPrice.ema_price.price) * Math.pow(10, ethPrice.ema_price.expo);
        console.log("📊 EMA Price: $" + emaPrice.toFixed(2));
        
        return priceData;
        
    } catch (error) {
        console.error("❌ Hermes fetch failed:", error.message);
        throw error;
    }
}

// Funktion ausführen
testHermesOnly().catch(console.error);