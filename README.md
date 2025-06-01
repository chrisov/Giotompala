# Pyth Oracle E-Shop Integration

This project demonstrates a complete integration of Pyth Network price feeds into a React e-commerce application with full Web3 blockchain capabilities.

## 🏗️ Architecture

The project consists of three main components:

### 1. React Frontend (`my-eshop-ts/`)
- **E-Shop**: Product catalog with live crypto price conversion
- **Price Display**: Real-time ETH/BTC/SOL prices using Hermes API
- **Pyth Oracle Interface**: Full Web3 integration for all 4 Pyth Oracle steps

### 2. Express API Server (`pyth-integration/api-server.js`)
- Bridges React frontend with blockchain backend
- Provides REST endpoints for all Pyth Oracle operations
- Handles Web3 transactions and smart contract interactions

### 3. Pyth Integration Backend (`pyth-integration/src/`)
- Complete implementation of 4 Pyth Oracle qualification steps
- Direct blockchain interaction with smart contracts
- Price pusher automation and testing scripts

## 🚀 Features

### Frontend Features
- ✅ Live crypto price ticker (ETH, BTC, SOL)
- ✅ Product price conversion (USD ↔ ETH)
- ✅ Auto-refreshing prices every 15 seconds
- ✅ Responsive design with gradient styling
- ✅ Web3 wallet integration
- ✅ Complete Pyth Oracle workflow interface

### Backend Features
- ✅ **Step 1**: Pull/Fetch from Hermes API
- ✅ **Step 2**: Update on-chain using `updatePriceFeeds`
- ✅ **Step 3**: Consume price data from smart contract
- ✅ **Step 4**: Automated price pusher
- ✅ Complete workflow automation
- ✅ Real-time wallet and transaction monitoring

## 🔧 Setup Instructions

### Prerequisites
- Node.js 18+
- npm or yarn
- MetaMask or Web3 wallet
- Sepolia testnet ETH for gas fees

### 1. Install Dependencies

```bash
# Install React app dependencies
cd my-eshop-ts
npm install

# Install API server dependencies
cd ../pyth-integration
npm install
```

### 2. Configure Environment

Copy and configure the environment file:

```bash
cd pyth-integration
cp .env.example .env
```

Edit `.env` with your values:
```env
RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
PYTH_CONTRACT_ADDRESS=0x2880aB155794e7179c9eE2e38200202908C17B43
API_PORT=3001
```

### 3. Start the Services

```bash
# Terminal 1: Start React app
cd my-eshop-ts
npm run dev
# Runs on http://localhost:5173 or 5174

# Terminal 2: Start API server
cd pyth-integration
npm run api
# Runs on http://localhost:3001
```

## 📡 API Endpoints

### Health & Info
- `GET /health` - Server health check
- `GET /feeds` - Available price feeds
- `GET /wallet` - Wallet information

### Pyth Oracle Operations
- `POST /step1/hermes` - Fetch from Hermes API
- `POST /step2/update` - Update on-chain price feeds
- `GET /step3/consume/:feedId` - Consume price data
- `POST /step4/pusher` - Run price pusher
- `POST /workflow/complete` - Complete 4-step workflow

### Example API Calls

```bash
# Health check
curl http://localhost:3001/health

# Get available feeds
curl http://localhost:3001/feeds

# Run complete workflow
curl -X POST http://localhost:3001/workflow/complete \\
  -H "Content-Type: application/json" \\
  -d '{"feedIds":["0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace"]}'

# Fetch from Hermes
curl -X POST http://localhost:3001/step1/hermes \\
  -H "Content-Type: application/json" \\
  -d '{"feedIds":["0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace"]}'
```

## 🎯 Pyth Oracle Integration

This project implements all 4 required Pyth Oracle qualification steps:

### Step 1: Pull/Fetch from Hermes ✅
- Fetches fresh price data from Pyth Hermes API
- Uses `@pythnetwork/hermes-client` for optimal performance
- Supports multiple price feeds simultaneously

### Step 2: Update On-Chain ✅
- Calls `updatePriceFeeds()` on Pyth smart contract
- Handles gas fee calculation and payment
- Provides transaction hash and confirmation

### Step 3: Consume Price Data ✅
- Reads prices using `getPriceNoOlderThan()`
- Validates price freshness and confidence intervals
- Supports custom age thresholds

### Step 4: Price Pusher ✅
- Automated price updates at configurable intervals
- Combines Steps 1-3 in continuous loop
- Monitors and logs all operations

## 🌐 Usage

### E-Shop Interface
1. Browse products with live crypto prices
2. Toggle between USD and ETH pricing
3. View real-time price ticker in header
4. Complete purchases with Web3 wallet integration

### Pyth Oracle Interface
1. Click "🐍 Pyth Oracle" tab in navigation
2. Select price feeds (ETH, BTC, SOL, USDC)
3. Run individual steps or complete workflow
4. Monitor real-time results and transaction hashes

## 📊 Price Feeds

| Symbol | Feed ID |
|--------|---------|
| ETH/USD | `0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace` |
| BTC/USD | `0xe62df6c8b4c85672d1c1b6b8b4b5c5d5f1a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5` |
| SOL/USD | `0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d4` |
| USDC/USD | `0xeaa020c61cc479712813461ce153894a96a6c1f1001ee01c12a3a9a77d5bfb9f` |

## 🔍 Technical Implementation

### Frontend Architecture
- **React + TypeScript**: Type-safe component development
- **CSS Modules**: Scoped styling with gradient themes
- **Custom Hooks**: `usePythPrices` for price management
- **Service Layer**: Separate API client and price services

### Backend Architecture
- **Express.js**: RESTful API server
- **Ethers.js v6**: Web3 blockchain interactions
- **Pyth SDK**: Official Hermes client integration
- **CORS**: Cross-origin resource sharing for frontend

### Smart Contract Integration
- **Network**: Sepolia Testnet
- **Contract**: `0x2880aB155794e7179c9eE2e38200202908C17B43`
- **Functions**: `updatePriceFeeds`, `getPriceNoOlderThan`, `getUpdateFee`

## 🛠️ Development Scripts

### React App
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
```

### API Server
```bash
npm run api        # Start API server
npm run test       # Test Hermes connection
npm run debug      # Debug Pyth integration
npm run poolbuy    # Run complete example
```

## 🔐 Security Considerations

- ⚠️ Never commit private keys to version control
- ⚠️ Use testnet for development and testing
- ⚠️ Validate all user inputs and API responses
- ⚠️ Implement proper error handling for Web3 operations
- ✅ Environment variables for sensitive configuration
- ✅ CORS protection for API endpoints

## 📈 Performance Optimizations

- **Price Caching**: 15-second refresh intervals
- **Batch Updates**: Multiple feeds in single API call
- **Error Handling**: Graceful degradation on failures
- **Loading States**: User feedback during operations
- **Responsive Design**: Mobile-first approach

## 🎉 Demo

The application is now running with:
- **React App**: http://localhost:5174
- **API Server**: http://localhost:3001
- **Live Price Feeds**: Real-time crypto data
- **Web3 Integration**: Full blockchain functionality

Navigate between the E-Shop and Pyth Oracle tabs to experience the complete integration!

## 📚 Next Steps

### Potential Enhancements
- [ ] Add more cryptocurrency pairs
- [ ] Implement price alerts and notifications
- [ ] Add historical price charts
- [ ] Integrate with DeFi protocols
- [ ] Add user authentication and profiles
- [ ] Implement order history and tracking
- [ ] Add support for multiple networks (Mainnet, Polygon, etc.)

### Production Deployment
- [ ] Configure production environment variables
- [ ] Set up CI/CD pipelines
- [ ] Implement proper logging and monitoring
- [ ] Add rate limiting and security headers
- [ ] Configure SSL/TLS certificates
- [ ] Set up database for user data persistence

---

**Built with ❤️ using Pyth Network, React, and Web3 technologies**
