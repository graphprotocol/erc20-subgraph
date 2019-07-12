require('dotenv/config')

const assert = require('assert')
const HDWalletProvider = require('truffle-hdwallet-provider')

assert(process.env.INFURA_PROJECT_ID, 'The INFURA_PROJECT_ID variable is required and not set')
assert(process.env.SECRET, 'The SECRET variable is required and not set')

module.exports = {
  networks: {
    development: {
      host: '127.0.0.1',
      port: 8545,
      network_id: '*'
    },

    kovan: {
      network_id: 42,
      gas: 5500000,
      gasPrice: 10e9,
      provider: function() {
        return new HDWalletProvider(process.env.SECRET, `https://kovan.infura.io/v3/${process.env.INFURA_PROJECT_ID}`)
      }
    },

    main: {
      network_id: 1,
      gas: 3000000,
      gasPrice: 10e9,
      provider: function() {
        return new HDWalletProvider(process.env.SECRET, `https://mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`)
      }
    }
  },

  compilers: {
    solc: {
      version: '0.5.10',
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  }
}
