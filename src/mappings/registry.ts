import { Address, JSONValue, Value, log, ipfs } from '@graphprotocol/graph-ts'

import { Token } from '../../generated/schema'
import { Unknown } from '../../generated/TokenRegistry/TokenRegistry'
import { StandardToken } from '../../generated/TokenRegistry/templates'

let REGISTRY_HASH = 'QmXuhRkxh7y6Gi1ZR8rEUWthcdKNWNbiEMpwzWpnMCRX6E'

export function initRegistry(event: Unknown): void {
  log.warning('Initializing token registry, block={}', [event.block.number.toString()])

  ipfs.mapJSON(REGISTRY_HASH, 'createToken', Value.fromString(''))
}

export function createToken(value: JSONValue, userData: Value): void {
  let data = value.toObject()

  let address = Address.fromString(data.get('address').toString())

  let token = Token.load(address.toHex())

  if (!token) {
    let name = data.get('name').toString()
    let symbol = data.get('symbol').toString()
    let decimals = data.get('decimals').toBigInt().toI32()
    let flags = data.get('flags').toArray().map<string>(value => value.toString())
    // TODO: let description = data.get('description').toString()
    // TODO: let imageUrl = data.get('image').toString()

    log.debug('Adding token to registry, name: {}, symbol: {}, address: {}, decimals: {}, flags: {}', [
      name,
      symbol,
      address.toHex(),
      decimals.toString(),
      flags.length ? flags.join('|') : 'none'
    ])

    token = new Token(address.toHex())
    token.address = address
    token.name = name
    token.symbol = symbol
    token.decimals = decimals
    // TODO: token.description = description
    // TODO: token.imageUrl = imageUrl

    token.save()

    // Start indexing token events
    StandardToken.create(address)
  } else {
    log.warning('Token {} already in registry', [address.toHex()])
  }
}
