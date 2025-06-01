// Pyth API Client for React frontend
export class PythAPIClient {
  constructor(baseURL = 'http://localhost:3001') {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Health check
  async getHealth() {
    return this.request('/health');
  }

  // Get available price feeds
  async getFeeds() {
    return this.request('/feeds');
  }

  // Get wallet information
  async getWallet() {
    return this.request('/wallet');
  }

  // Step 1: Fetch from Hermes
  async fetchFromHermes(feedIds) {
    return this.request('/step1/hermes', {
      method: 'POST',
      body: JSON.stringify({ feedIds }),
    });
  }

  // Step 2: Update on-chain
  async updateOnChain(updateData) {
    return this.request('/step2/update', {
      method: 'POST',
      body: JSON.stringify({ updateData }),
    });
  }

  // Step 3: Consume price
  async consumePrice(feedId, maxAge = 300) {
    return this.request(`/step3/consume/${feedId}?maxAge=${maxAge}`);
  }

  // Step 4: Price pusher
  async runPricePusher(feedIds, intervalSeconds = 60) {
    return this.request('/step4/pusher', {
      method: 'POST',
      body: JSON.stringify({ feedIds, intervalSeconds }),
    });
  }

  // Complete workflow
  async runCompleteWorkflow(feedIds) {
    return this.request('/workflow/complete', {
      method: 'POST',
      body: JSON.stringify({ feedIds }),
    });
  }
}

export const pythAPI = new PythAPIClient();
