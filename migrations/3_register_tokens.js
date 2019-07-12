const TokenRegistry = artifacts.require('TokenRegistry')

module.exports = async function(deployer, network) {
  const registry = await TokenRegistry.deployed()

  console.log('Network:', network)
  console.log('Token registry address:', registry.address)

  const tokens = network.startsWith('kovan')
    ? require('../data/tokens.kovan.json')
    : require('../data/tokens.main.json')

  for (const token of tokens) {
    console.log(`Registering ${token.name} (${token.symbol}) at ${token.address}`)

    await registry.register({
      contractAddress: token.address,
      symbol: token.symbol,
      name: token.name,
      decimals: token.decimals,
      flags: 0 // TODO: Get flags from token.flags
    })
  }
}
