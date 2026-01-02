require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true, // Required to handle stack too deep errors
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    hedera_testnet: {
      url: "https://testnet.hashio.io/api",
      chainId: 296,
      // Note: We don't set accounts here because Hedera uses its own SDK
      // The deployment script uses @hashgraph/sdk directly, not Hardhat's ethers provider
      accounts: [],
    },
    hedera_mainnet: {
      url: "https://mainnet.hashio.io/api",
      chainId: 295,
      // Note: We don't set accounts here because Hedera uses its own SDK
      accounts: [],
    },
    hedera_previewnet: {
      url: "https://previewnet.hashio.io/api",
      chainId: 297,
      // Note: We don't set accounts here because Hedera uses its own SDK
      accounts: [],
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

