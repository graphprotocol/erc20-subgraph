const TokenRegistry = artifacts.require('TokenRegistry')

module.exports = async function(deployer) {
  await deployer.deploy(TokenRegistry)
}
