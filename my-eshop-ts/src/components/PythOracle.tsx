import React, { useState, useEffect } from 'react';
import { pythAPI } from '../services/pythAPIClient';
import styles from './PythOracle.module.css';

interface StepResult {
  success: boolean;
  step?: number;
  description: string;
  error?: string;
  timestamp: number;
  [key: string]: any;
}

interface WalletInfo {
  address: string;
  balance: string;
  network: {
    name: string;
    chainId: string;
  };
}

const PythOracle: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [availableFeeds, setAvailableFeeds] = useState<Record<string, string>>({});
  const [selectedFeeds, setSelectedFeeds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<StepResult[]>([]);
  const [currentStep, setCurrentStep] = useState<number | null>(null);

  useEffect(() => {
    checkConnection();
    loadFeeds();
  }, []);

  const checkConnection = async () => {
    try {
      const health = await pythAPI.getHealth();
      if (health.status === 'healthy') {
        setIsConnected(true);
        const wallet = await pythAPI.getWallet();
        setWalletInfo(wallet);
      }
    } catch (error) {
      console.error('Connection failed:', error);
      setIsConnected(false);
    }
  };

  const loadFeeds = async () => {
    try {
      const feedsData = await pythAPI.getFeeds();
      setAvailableFeeds(feedsData.feeds);
      // Select ETH by default
      const ethFeedId = feedsData.feeds.ETH_USD;
      if (ethFeedId) {
        setSelectedFeeds([ethFeedId]);
      }
    } catch (error) {
      console.error('Failed to load feeds:', error);
    }
  };

  const addResult = (result: StepResult) => {
    setResults(prev => [...prev, result]);
  };

  const clearResults = () => {
    setResults([]);
    setCurrentStep(null);
  };

  const runStep1 = async () => {
    if (selectedFeeds.length === 0) return;
    
    setIsLoading(true);
    setCurrentStep(1);
    
    try {
      const result = await pythAPI.fetchFromHermes(selectedFeeds);
      addResult(result);
      return result;
    } catch (error) {
      const errorResult = {
        success: false,
        step: 1,
        description: 'Fetch from Hermes API',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      };
      addResult(errorResult);
      throw error;
    } finally {
      setCurrentStep(null);
      setIsLoading(false);
    }
  };

  const runStep2 = async (updateData: string[]) => {
    setIsLoading(true);
    setCurrentStep(2);
    
    try {
      const result = await pythAPI.updateOnChain(updateData);
      addResult(result);
      return result;
    } catch (error) {
      const errorResult = {
        success: false,
        step: 2,
        description: 'Update on-chain price feeds',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      };
      addResult(errorResult);
      throw error;
    } finally {
      setCurrentStep(null);
      setIsLoading(false);
    }
  };

  const runStep3 = async (feedId: string) => {
    setIsLoading(true);
    setCurrentStep(3);
    
    try {
      const result = await pythAPI.consumePrice(feedId);
      addResult(result);
      return result;
    } catch (error) {
      const errorResult = {
        success: false,
        step: 3,
        description: 'Consume on-chain price data',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      };
      addResult(errorResult);
      throw error;
    } finally {
      setCurrentStep(null);
      setIsLoading(false);
    }
  };

  const runCompleteWorkflow = async () => {
    if (selectedFeeds.length === 0) return;
    
    setIsLoading(true);
    clearResults();
    
    try {
      const result = await pythAPI.runCompleteWorkflow(selectedFeeds);
      addResult({
        success: true,
        description: 'Complete Pyth Oracle Workflow',
        timestamp: Date.now(),
        ...result
      });
    } catch (error) {
      addResult({
        success: false,
        description: 'Complete Pyth Oracle Workflow',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runPricePusher = async () => {
    if (selectedFeeds.length === 0) return;
    
    setIsLoading(true);
    clearResults();
    
    try {
      const result = await pythAPI.runPricePusher(selectedFeeds, 30); // 30 second intervals
      addResult({
        success: true,
        description: 'Price Pusher (Automated Updates)',
        timestamp: Date.now(),
        ...result
      });
    } catch (error) {
      addResult({
        success: false,
        description: 'Price Pusher Failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFeedSelection = (feedId: string) => {
    setSelectedFeeds(prev => 
      prev.includes(feedId) 
        ? prev.filter(id => id !== feedId)
        : [...prev, feedId]
    );
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getFeedName = (feedId: string) => {
    const entry = Object.entries(availableFeeds).find(([_, id]) => id === feedId);
    return entry ? entry[0] : 'Unknown';
  };

  if (!isConnected) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>🔌 Connection Failed</h2>
          <p>Unable to connect to Pyth API server.</p>
          <p>Make sure the API server is running on port 3001.</p>
          <button onClick={checkConnection} className={styles.button}>
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>🐍 Pyth Oracle Integration</h1>
        <p>Complete 4-step Pyth Oracle workflow with blockchain integration</p>
      </div>

      {walletInfo && (
        <div className={styles.walletInfo}>
          <h3>💼 Wallet Information</h3>
          <div className={styles.walletDetails}>
            <p><strong>Address:</strong> {walletInfo.address}</p>
            <p><strong>Balance:</strong> {parseFloat(walletInfo.balance).toFixed(4)} ETH</p>
            <p><strong>Network:</strong> {walletInfo.network.name} (Chain ID: {walletInfo.network.chainId})</p>
          </div>
        </div>
      )}

      <div className={styles.feedSelection}>
        <h3>📊 Select Price Feeds</h3>
        <div className={styles.feedGrid}>
          {Object.entries(availableFeeds).map(([name, feedId]) => (
            <label key={feedId} className={styles.feedOption}>
              <input
                type="checkbox"
                checked={selectedFeeds.includes(feedId)}
                onChange={() => toggleFeedSelection(feedId)}
              />
              <span className={styles.feedName}>{name}</span>
            </label>
          ))}
        </div>
        <p className={styles.selectedCount}>
          {selectedFeeds.length} feed(s) selected
        </p>
      </div>

      <div className={styles.controls}>
        <h3>🚀 Oracle Operations</h3>
        
        {/* Individual Steps */}
        <div className={styles.stepSection}>
          <h4>Individual Steps</h4>
          <div className={styles.buttonGrid}>
            <button 
              onClick={runStep1}
              disabled={isLoading || selectedFeeds.length === 0}
              className={`${styles.button} ${styles.step1}`}
            >
              {currentStep === 1 ? '⏳ Running...' : '1️⃣ Fetch from Hermes'}
            </button>
            
            <button 
              onClick={() => {
                const lastResult = results[results.length - 1];
                if (lastResult && lastResult.success && lastResult.updateData) {
                  runStep2(lastResult.updateData);
                } else {
                  alert('Please run Step 1 first to get update data');
                }
              }}
              disabled={isLoading}
              className={`${styles.button} ${styles.step2}`}
            >
              {currentStep === 2 ? '⏳ Running...' : '2️⃣ Update On-Chain'}
            </button>
            
            <button 
              onClick={() => {
                if (selectedFeeds.length > 0) {
                  runStep3(selectedFeeds[0]);
                } else {
                  alert('Please select a feed first');
                }
              }}
              disabled={isLoading || selectedFeeds.length === 0}
              className={`${styles.button} ${styles.step3}`}
            >
              {currentStep === 3 ? '⏳ Running...' : '3️⃣ Consume Price'}
            </button>
            
            <button 
              onClick={runPricePusher}
              disabled={isLoading || selectedFeeds.length === 0}
              className={`${styles.button} ${styles.step4}`}
            >
              {isLoading ? '⏳ Running...' : '4️⃣ Price Pusher'}
            </button>
          </div>
        </div>

        {/* Complete Workflows */}
        <div className={styles.workflowSection}>
          <h4>Complete Workflows</h4>
          <div className={styles.buttonGrid}>
            <button 
              onClick={runCompleteWorkflow}
              disabled={isLoading || selectedFeeds.length === 0}
              className={`${styles.button} ${styles.primary}`}
            >
              {isLoading ? '⏳ Running...' : '🔄 Complete Workflow (All Steps)'}
            </button>
            
            <button 
              onClick={clearResults}
              disabled={isLoading}
              className={`${styles.button} ${styles.tertiary}`}
            >
              🗑️ Clear Results
            </button>
          </div>
        </div>
      </div>

      {currentStep && (
        <div className={styles.currentStep}>
          <p>🔄 Currently running Step {currentStep}...</p>
          <div className={styles.loader}></div>
        </div>
      )}

      <div className={styles.results}>
        <h3>📋 Results</h3>
        {results.length === 0 ? (
          <p className={styles.noResults}>No operations performed yet.</p>
        ) : (
          <div className={styles.resultsList}>
            {results.map((result, index) => (
              <div 
                key={index} 
                className={`${styles.result} ${result.success ? styles.success : styles.error}`}
              >
                <div className={styles.resultHeader}>
                  <span className={styles.resultIcon}>
                    {result.success ? '✅' : '❌'}
                  </span>
                  <span className={styles.resultTitle}>{result.description}</span>
                  <span className={styles.resultTime}>{formatTime(result.timestamp)}</span>
                </div>
                
                {result.error && (
                  <div className={styles.resultError}>
                    <strong>Error:</strong> {result.error}
                  </div>
                )}
                
                {/* Individual Step Results */}
                {result.success && result.step === 1 && result.prices && (
                  <div className={styles.stepDetails}>
                    <strong>📊 Fetched Prices:</strong>
                    <div className={styles.priceData}>
                      {Object.entries(result.prices).map(([symbol, data]: [string, any]) => (
                        <div key={symbol} className={styles.priceItem}>
                          <strong>{symbol}:</strong> ${data.price?.toFixed(2) || 'N/A'}
                          <small> (Conf: ±${data.confidence?.toFixed(2) || 'N/A'})</small>
                        </div>
                      ))}
                    </div>
                    {result.updateData && (
                      <div className={styles.updateData}>
                        <strong>Update Data:</strong> {result.updateData.length} byte array(s) ready for on-chain update
                      </div>
                    )}
                  </div>
                )}
                
                {result.success && result.step === 2 && result.transactionHash && (
                  <div className={styles.stepDetails}>
                    <strong>⛓️ Blockchain Transaction:</strong>
                    <div className={styles.transactionInfo}>
                      <div><strong>TX Hash:</strong> {result.transactionHash}</div>
                      <div><strong>Gas Used:</strong> {result.gasUsed || 'N/A'}</div>
                      <div><strong>Status:</strong> ✅ Confirmed</div>
                    </div>
                  </div>
                )}
                
                {result.success && result.step === 3 && result.priceData && (
                  <div className={styles.stepDetails}>
                    <strong>📖 On-Chain Price Data:</strong>
                    <div className={styles.onChainData}>
                      {Array.isArray(result.priceData) ? result.priceData.map((price: any, idx: number) => (
                        <div key={idx} className={styles.priceItem}>
                          <strong>Price:</strong> ${price.price?.toFixed(2) || 'N/A'}
                          <small> (Updated: {new Date(price.publishTime * 1000).toLocaleTimeString()})</small>
                        </div>
                      )) : (
                        <div className={styles.priceItem}>
                          <strong>Price:</strong> ${result.priceData.price?.toFixed(2) || 'N/A'}
                          <small> (Updated: {new Date(result.priceData.publishTime * 1000).toLocaleTimeString()})</small>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Complete Workflow Results */}
                {result.success && result.steps && (
                  <div className={styles.workflowSteps}>
                    {result.steps.step1_hermes && (
                      <div className={styles.stepResult}>
                        <strong>Step 1 - Hermes:</strong> Fetched {Object.keys(result.steps.step1_hermes.prices || {}).length} price(s)
                      </div>
                    )}
                    {result.steps.step2_update && (
                      <div className={styles.stepResult}>
                        <strong>Step 2 - Update:</strong> TX {result.steps.step2_update.transactionHash?.slice(0, 10)}...
                      </div>
                    )}
                    {result.steps.step3_consume && (
                      <div className={styles.stepResult}>
                        <strong>Step 3 - Consume:</strong> Read {result.steps.step3_consume.length} price(s) from contract
                      </div>
                    )}
                  </div>
                )}
                
                {result.success && result.totalUpdates && (
                  <div className={styles.pusherResult}>
                    <strong>Price Pusher:</strong> Completed {result.totalUpdates} automated updates
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PythOracle;
