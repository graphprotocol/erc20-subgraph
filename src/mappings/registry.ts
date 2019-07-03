import { Address, EthereumBlock, JSONValue, Value, log, ipfs } from '@graphprotocol/graph-ts'

import { Token } from '../../generated/schema'
import { ERC20Token } from '../../generated/TokenRegistry/templates'

let REGISTRY_HASH = 'QmXuhRkxh7y6Gi1ZR8rEUWthcdKNWNbiEMpwzWpnMCRX6E'

// TODO: Improve this approach when IPFS Bulk Import feature when it is fully implemented
export function initRegistry(block: EthereumBlock): void {
  let initialized = block.number.isI32() && block.number.toI32() > 1

  if (!initialized) {
    ipfs.mapJSON(REGISTRY_HASH, 'createToken', Value.fromString(''))
  }
}

export function createToken(value: JSONValue, userData: Value): void {
  let data = value.toObject()

  let address = Address.fromString(data.get('address').toString())

  let token = Token.load(address.toHex())

  if (!token) {
    let flags = data.get('flags').toArray().map<string>(value => value.toString())

    let name = data.get('name').toString()
    let symbol = data.get('symbol').toString()
    let decimals = data.get('decimals').toBigInt().toI32()

    log.debug('Adding token to registry, name: {}, symbol: {}, address: {}, decimals: {}, flags: {}', [
      name,
      symbol,
      address.toHex(),
      decimals.toString(),
      flags.length ? flags.join('|') : 'none',
    ])

    token = new Token(address.toHex())
    token.address = address
    token.name = name
    token.symbol = symbol
    token.decimals = decimals

    // TODO: token.description = data.get('description').toString()
    // TODO: token.imageUrl = data.get('image').toString()

    token.save()

    // Start indexing token events
    ERC20Token.create(address)
  } else {
    log.warning('Token {} already in registry', [address.toHex()])
  }
}
