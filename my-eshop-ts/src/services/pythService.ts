export interface PriceData {
  symbol: string;
  price: number;
  confidence: number;
  publishTime: number;
  change24h?: number;
}

export class PythPriceService {
  private baseUrl = 'https://hermes.pyth.network';
  
  // Pyth Price Feed IDs for major cryptocurrencies
  private readonly PRICE_IDS = {
    'ETH/USD': '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
    'BTC/USD': '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
    'SOL/USD': '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
    'AVAX/USD': '0x93da3352f9f1d105fdfe4971cfa80e9dd777bfc5d0f683ebb6e1294b92137bb7',
    'MATIC/USD': '0x5de33a9112c2b700b8d30b8a3402c103578ccfa2765696471cc672bd5cf6ac52'
  };

  async getPrice(symbol: string): Promise<PriceData | null> {
    try {
      const priceId = this.PRICE_IDS[symbol as keyof typeof this.PRICE_IDS];
      if (!priceId) {
        console.warn(`Price ID not found for symbol: ${symbol}`);
        return null;
      }

      const response = await fetch(`${this.baseUrl}/api/latest_price_feeds?ids[]=${priceId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data || !data.length) {
        console.warn(`No price feed data for ${symbol}`);
        return null;
      }

      const priceFeed = data[0];
      const price = priceFeed.price;

      if (!price) {
        console.warn(`No price data in feed for ${symbol}`);
        return null;
      }

      // Convert price to readable format
      const normalizedPrice = Number(price.price) * Math.pow(10, price.expo);
      const normalizedConf = Number(price.conf) * Math.pow(10, price.expo);

      return {
        symbol,
        price: normalizedPrice,
        confidence: normalizedConf,
        publishTime: price.publish_time
      };
    } catch (error) {
      console.error(`Error fetching price for ${symbol}:`, error);
      return null;
    }
  }

  async getAllPrices(): Promise<PriceData[]> {
    try {
      const priceIds = Object.values(this.PRICE_IDS);
      const symbols = Object.keys(this.PRICE_IDS);
      
      const idsQuery = priceIds.map(id => `ids[]=${id}`).join('&');
      const response = await fetch(`${this.baseUrl}/api/latest_price_feeds?${idsQuery}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data) return [];

      return data.map((feed: any, index: number) => {
        const price = feed.price;
        if (!price) return null;

        const normalizedPrice = Number(price.price) * Math.pow(10, price.expo);
        const normalizedConf = Number(price.conf) * Math.pow(10, price.expo);

        return {
          symbol: symbols[index],
          price: normalizedPrice,
          confidence: normalizedConf,
          publishTime: price.publish_time
        };
      }).filter(Boolean) as PriceData[];
    } catch (error) {
      console.error('Error fetching all prices:', error);
      return [];
    }
  }

  getAvailableSymbols(): string[] {
    return Object.keys(this.PRICE_IDS);
  }
}
