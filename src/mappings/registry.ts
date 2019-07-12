import { log } from '@graphprotocol/graph-ts'

import { Token } from '../../generated/schema'
import { TokenRegistered } from '../../generated/TokenRegistry/TokenRegistry'
import { ERC20Token } from '../../generated/TokenRegistry/templates'

export function handleToken(event: TokenRegistered): void {
  let token = event.params.info
  let address = token.contractAddress

  let entity = Token.load(address.toHex())

  if (!entity) {
    let name = token.name
    let symbol = token.symbol
    let decimals = token.decimals

    log.debug('Adding token to registry, name: {}, symbol: {}, address: {}, decimals: {}', [
      name,
      symbol,
      address.toHex(),
      decimals.toString()
    ])

    entity = new Token(address.toHex())
    entity.address = address
    entity.name = name
    entity.symbol = symbol
    entity.decimals = decimals

    // TODO: token.description = data.get('description').toString()
    // TODO: token.imageUrl = data.get('image').toString()

    entity.save()

    // Start indexing token events
    ERC20Token.create(address)
  } else {
    log.warning('Token {} already in registry', [address.toHex()])
  }
}
