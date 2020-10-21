import { Address, JSONValue, Value, log, ipfs } from '@graphprotocol/graph-ts'

import { Token } from '../../generated/schema'
import { ERC20 } from '../../generated/TokenRegistry/ERC20'
import { Unknown } from '../../generated/TokenRegistry/TokenRegistry'

import { BurnableToken, MintableToken, StandardToken } from '../../generated/templates'

import { REGISTRY_HASH } from '../config'
import { toDecimal, ZERO } from '../helpers/number'
import { decodeFlags, hasBurnEvent, hasMintEvent, DEFAULT_DECIMALS } from '../helpers/token'

// export function initRegistry(event: Unknown): void {
//   log.debug('Initializing token registry, block={}', [event.block.number.toString()])

//   ipfs.mapJSON(REGISTRY_HASH, 'createToken', Value.fromString(''))
// }

export class IValue {
    address: string
    name: string
    symbol: string
    imageUrl: string
    description: string | null
}
export function createToken(address: string, name: string, symbol: string, imageUrl: string): void {

  //let address: string | null = value.address
  //let name: string | null = value.name
  //let symbol: string | null = value.symbol
  let decimals: u32 = DEFAULT_DECIMALS
  let description: string | null = null
  //let imageUrl: string | null = value.imageUrl
  let flags: u16 =  0

  if (address != null) {
    let contractAddress = Address.fromString(address)

    // Persist token data if it doesn't already exist
    let token = Token.load(contractAddress.toHex())

    if (token == null) {
      let initialSupply = ERC20.bind(contractAddress).try_totalSupply()

      token = new Token(contractAddress.toHex())
      token.address = contractAddress
      token.name = name
      token.symbol = symbol
      token.decimals = decimals
      token.description = description
      token.imageUrl = imageUrl
      token.flags = decodeFlags(flags)

      token.eventCount = ZERO
      token.burnEventCount = ZERO
      token.mintEventCount = ZERO
      token.transferEventCount = ZERO

      token.totalSupply = initialSupply.reverted ? ZERO.toBigDecimal() : toDecimal(initialSupply.value, token.decimals)
      token.totalBurned = ZERO.toBigDecimal()
      token.totalMinted = ZERO.toBigDecimal()
      token.totalTransferred = ZERO.toBigDecimal()

      log.debug('Adding token to registry, name: {}, symbol: {}, address: {}, decimals: {}, flags: {}', [
        token.name,
        token.symbol,
        token.id,
        decimals.toString(), // TODO: use token.decimals.toString() when type 'i32' implements toString()
        token.flags.length ? token.flags.join('|') : 'none',
      ])

      token.save()

      // Start indexing token events
      StandardToken.create(contractAddress)

      if (hasBurnEvent(flags)) {
        BurnableToken.create(contractAddress)
      }

      if (hasMintEvent(flags)) {
        MintableToken.create(contractAddress)
      }
    } else {
      log.warning('Token {} already in registry', [contractAddress.toHex()])
    }
  }
}
