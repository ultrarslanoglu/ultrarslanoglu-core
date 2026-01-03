/**
 * Blockchain Configuration
 * Network setup and contract addresses
 */

module.exports = {
  // Supported networks
  networks: {
    hardhat: {
      chainId: 31337
    },
    localhost: {
      url: 'http://127.0.0.1:8545',
      chainId: 31337
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY',
      accounts: process.env.SEPOLIA_PRIVATE_KEY ? [process.env.SEPOLIA_PRIVATE_KEY] : [],
      chainId: 11155111
    },
    polygon: {
      url: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
      accounts: process.env.POLYGON_PRIVATE_KEY ? [process.env.POLYGON_PRIVATE_KEY] : [],
      chainId: 137
    },
    mumbai: {
      url: process.env.MUMBAI_RPC_URL || 'https://rpc-mumbai.maticvigil.com',
      accounts: process.env.MUMBAI_PRIVATE_KEY ? [process.env.MUMBAI_PRIVATE_KEY] : [],
      chainId: 80001
    },
    mainnet: {
      url: process.env.MAINNET_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY',
      accounts: process.env.MAINNET_PRIVATE_KEY ? [process.env.MAINNET_PRIVATE_KEY] : [],
      chainId: 1
    }
  },

  // Contract deployment addresses
  contracts: {
    hardhat: {
      nftTicket: process.env.NFT_TICKET_ADDRESS_HARDHAT || ''
    },
    localhost: {
      nftTicket: process.env.NFT_TICKET_ADDRESS_LOCALHOST || ''
    },
    sepolia: {
      nftTicket: process.env.NFT_TICKET_ADDRESS_SEPOLIA || '0x...'
    },
    polygon: {
      nftTicket: process.env.NFT_TICKET_ADDRESS_POLYGON || '0x...'
    },
    mumbai: {
      nftTicket: process.env.NFT_TICKET_ADDRESS_MUMBAI || '0x...'
    },
    mainnet: {
      nftTicket: process.env.NFT_TICKET_ADDRESS_MAINNET || '0x...'
    }
  },

  // Get contract address for current network
  getContractAddress: function(network) {
    return this.contracts[network]?.nftTicket || '';
  },

  // Get network config
  getNetworkConfig: function(network) {
    return this.networks[network] || this.networks.localhost;
  }
};
