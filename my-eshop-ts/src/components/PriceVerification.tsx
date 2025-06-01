import React, { useState, useEffect } from 'react';
import { pythAPI } from '../services/pythAPIClient';
import styles from './PriceVerification.module.css';

interface PriceVerificationProps {
  isVisible: boolean;
  onClose: () => void;
  productPrice: number;
  productName: string;
  onConfirm: (verifiedPrice: number) => void;
}

const PriceVerification: React.FC<PriceVerificationProps> = ({
  isVisible,
  onClose,
  productPrice,
  productName,
  onConfirm
}) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [ethPrice, setEthPrice] = useState<number | null>(null);
  const [cryptoPrice, setCryptoPrice] = useState<number | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);

  useEffect(() => {
    if (isVisible) {
      verifyPrice();
    }
  }, [isVisible]);

  const verifyPrice = async () => {
    setIsVerifying(true);
    setVerificationStatus('verifying');
    
    try {
      // Step 1: Fetch current ETH price from Oracle
      const hermesResult = await pythAPI.fetchFromHermes(['0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace']);
      
      if (hermesResult.success && hermesResult.prices.ETH_USD) {
        const currentEthPrice = hermesResult.prices.ETH_USD.price;
        setEthPrice(currentEthPrice);
        
        // Step 2: Update on-chain (silent, in background)
        try {
          const updateResult = await pythAPI.updateOnChain(hermesResult.updateData);
          if (updateResult.success) {
            setTransactionHash(updateResult.transactionHash);
          }
        } catch (error) {
          console.warn('On-chain update failed, using cached price:', error);
        }
        
        // Calculate crypto price
        const priceInEth = productPrice / currentEthPrice;
        setCryptoPrice(priceInEth);
        setVerificationStatus('success');
      } else {
        throw new Error('Failed to fetch price from Oracle');
      }
    } catch (error) {
      console.error('Price verification failed:', error);
      setVerificationStatus('error');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleConfirm = () => {
    if (cryptoPrice) {
      onConfirm(cryptoPrice);
    }
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>🔒 Blockchain Price Verification</h2>
          <button onClick={onClose} className={styles.closeButton}>×</button>
        </div>
        
        <div className={styles.content}>
          <div className={styles.productInfo}>
            <h3>{productName}</h3>
            <p className={styles.usdPrice}>${productPrice.toFixed(2)} USD</p>
          </div>

          {verificationStatus === 'verifying' && (
            <div className={styles.verifying}>
              <div className={styles.spinner}></div>
              <p>🔍 Verifying current price with Pyth Oracle...</p>
              <small>Getting latest ETH price from blockchain</small>
            </div>
          )}

          {verificationStatus === 'success' && ethPrice && cryptoPrice && (
            <div className={styles.success}>
              <div className={styles.priceComparison}>
                <div className={styles.priceRow}>
                  <span>💰 Current ETH Price:</span>
                  <span className={styles.price}>${ethPrice.toFixed(2)}</span>
                </div>
                <div className={styles.priceRow}>
                  <span>🔄 Product Price in ETH:</span>
                  <span className={styles.cryptoPrice}>{cryptoPrice.toFixed(6)} ETH</span>
                </div>
              </div>
              
              <div className={styles.verification}>
                <div className={styles.checkmark}>✅</div>
                <p><strong>Price Verified!</strong></p>
                <small>This price is guaranteed by Pyth Oracle blockchain data</small>
              </div>

              {transactionHash && (
                <div className={styles.transaction}>
                  <p>🔗 Oracle Update Transaction:</p>
                  <code className={styles.txHash}>
                    {transactionHash.slice(0, 10)}...{transactionHash.slice(-8)}
                  </code>
                </div>
              )}
            </div>
          )}

          {verificationStatus === 'error' && (
            <div className={styles.error}>
              <div className={styles.errorIcon}>❌</div>
              <p><strong>Verification Failed</strong></p>
              <small>Unable to verify price with Oracle. Please try again.</small>
            </div>
          )}
        </div>

        <div className={styles.actions}>
          {verificationStatus === 'success' && (
            <>
              <button onClick={handleConfirm} className={styles.confirmButton}>
                ✅ Confirm & Pay {cryptoPrice?.toFixed(6)} ETH
              </button>
              <button onClick={onClose} className={styles.cancelButton}>
                Cancel
              </button>
            </>
          )}
          
          {verificationStatus === 'error' && (
            <>
              <button onClick={verifyPrice} className={styles.retryButton}>
                🔄 Retry Verification
              </button>
              <button onClick={onClose} className={styles.cancelButton}>
                Cancel
              </button>
            </>
          )}
          
          {verificationStatus === 'verifying' && (
            <button onClick={onClose} className={styles.cancelButton}>
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PriceVerification;
