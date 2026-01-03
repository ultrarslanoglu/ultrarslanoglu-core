/**
 * Web3 Service
 * Handles blockchain interactions with NFTTicket contract
 */

const ethers = require('ethers');
const blockchainConfig = require('../config/blockchain');
const logger = require('../../../shared/logger');

const NFT_TICKET_ABI = require('../abis/NFTTicket.json');

class Web3Service {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.network = process.env.BLOCKCHAIN_NETWORK || 'localhost';
  }

  /**
   * Initialize Web3 connection
   */
  async initialize() {
    try {
      const networkConfig = blockchainConfig.getNetworkConfig(this.network);
      
      // Connect to network
      this.provider = new ethers.JsonRpcProvider(networkConfig.url);
      
      // Get signer from private key
      if (process.env.PRIVATE_KEY) {
        this.signer = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
      } else {
        logger.warn('No PRIVATE_KEY provided, using provider only');
      }

      // Initialize contract
      const contractAddress = blockchainConfig.getContractAddress(this.network);
      
      if (!contractAddress) {
        throw new Error(`No contract address for network: ${this.network}`);
      }

      this.contract = new ethers.Contract(
        contractAddress,
        NFT_TICKET_ABI,
        this.signer || this.provider
      );

      logger.info(`Web3 Service initialized on ${this.network} network`);
      logger.info(`Contract address: ${contractAddress}`);

      return true;
    } catch (error) {
      logger.error('Web3 initialization failed:', error);
      throw error;
    }
  }

  /**
   * Get contract instance
   */
  getContract() {
    if (!this.contract) {
      throw new Error('Contract not initialized. Call initialize() first');
    }
    return this.contract;
  }

  /**
   * Get signer
   */
  getSigner() {
    if (!this.signer) {
      throw new Error('Signer not available. Check PRIVATE_KEY');
    }
    return this.signer;
  }

  /**
   * Get network
   */
  getNetwork() {
    return this.network;
  }

  /**
   * Get provider
   */
  getProvider() {
    return this.provider;
  }

  /**
   * Get signer address
   */
  async getSignerAddress() {
    if (!this.signer) {
      throw new Error('Signer not available');
    }
    return await this.signer.getAddress();
  }

  /**
   * Get contract address
   */
  getContractAddress() {
    return blockchainConfig.getContractAddress(this.network);
  }

  /**
   * Wait for transaction
   */
  async waitForTransaction(txHash, confirmations = 1) {
    try {
      const receipt = await this.provider.waitForTransaction(txHash, confirmations);
      return receipt;
    } catch (error) {
      logger.error('Transaction wait failed:', error);
      throw error;
    }
  }

  /**
   * Get gas price
   */
  async getGasPrice() {
    try {
      const feeData = await this.provider.getFeeData();
      return {
        gasPrice: feeData.gasPrice?.toString(),
        maxFeePerGas: feeData.maxFeePerGas?.toString(),
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString()
      };
    } catch (error) {
      logger.error('Get gas price failed:', error);
      throw error;
    }
  }

  /**
   * Estimate gas for function call
   */
  async estimateGas(functionName, args) {
    try {
      if (!this.contract[functionName]) {
        throw new Error(`Function ${functionName} not found in contract`);
      }

      const estimatedGas = await this.contract[functionName].estimateGas(...args);
      return estimatedGas.toString();
    } catch (error) {
      logger.error(`Estimate gas for ${functionName} failed:`, error);
      throw error;
    }
  }

  /**
   * Call contract function (read-only)
   */
  async call(functionName, ...args) {
    try {
      if (!this.contract[functionName]) {
        throw new Error(`Function ${functionName} not found in contract`);
      }

      const result = await this.contract[functionName](...args);
      return result;
    } catch (error) {
      logger.error(`Contract call ${functionName} failed:`, error);
      throw error;
    }
  }

  /**
   * Send contract transaction
   */
  async sendTransaction(functionName, args, options = {}) {
    try {
      if (!this.signer) {
        throw new Error('Signer not available. Cannot send transaction');
      }

      if (!this.contract[functionName]) {
        throw new Error(`Function ${functionName} not found in contract`);
      }

      const txOptions = {
        ...options
      };

      const tx = await this.contract[functionName](...args, txOptions);
      
      logger.info(`Transaction sent: ${functionName}`, { txHash: tx.hash });

      const receipt = await tx.wait(1);
      
      logger.info(`Transaction confirmed: ${functionName}`, { 
        txHash: tx.hash,
        blockNumber: receipt.blockNumber 
      });

      return {
        hash: tx.hash,
        receipt: receipt
      };
    } catch (error) {
      logger.error(`Contract transaction ${functionName} failed:`, error);
      throw error;
    }
  }

  /**
   * Format ether
   */
  formatEther(value) {
    return ethers.formatEther(value);
  }

  /**
   * Parse ether
   */
  parseEther(value) {
    return ethers.parseEther(value);
  }

  /**
   * Get block
   */
  async getBlock(blockTag = 'latest') {
    try {
      return await this.provider.getBlock(blockTag);
    } catch (error) {
      logger.error('Get block failed:', error);
      throw error;
    }
  }

  /**
   * Get block timestamp
   */
  async getBlockTimestamp() {
    try {
      const block = await this.provider.getBlock('latest');
      return block.timestamp;
    } catch (error) {
      logger.error('Get block timestamp failed:', error);
      throw error;
    }
  }
}

module.exports = Web3Service;
