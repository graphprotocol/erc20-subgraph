import { Address, JSONValue, Value, log, ipfs } from '@graphprotocol/graph-ts'

import { Token } from '../../generated/schema'
import { ERC20 } from '../../generated/TokenRegistry/ERC20'
import { Unknown } from '../../generated/TokenRegistry/TokenRegistry'

import { BurnableToken, MintableToken, PausableToken, StandardToken } from '../../generated/templates'

import { REGISTRY_HASH } from '../config'
import { toDecimal, ZERO } from '../helpers/number'
import { decodeFlags, hasBurnEvent, hasMintEvent, DEFAULT_DECIMALS } from '../helpers/token'

export function initRegistry(event: Unknown): void {
  log.debug('Initializing token registry, block={}', [event.block.number.toString()])

  ipfs.mapJSON(REGISTRY_HASH, 'createToken', Value.fromString(''))
}

export function createToken(value: JSONValue, userData: Value): void {
  let rawData = value.toArray()

  let address: string | null = rawData[0].isNull() ? null : rawData[0].toString()
  let name: string | null = rawData[1].isNull() ? null : rawData[1].toString()
  let symbol: string | null = rawData[2].isNull() ? null : rawData[2].toString()
  let decimals: u32 = rawData[3].isNull() ? DEFAULT_DECIMALS : rawData[3].toBigInt().toI32()
  let description: string | null = rawData[4].isNull() ? null : rawData[4].toString()
  let imageUrl: string | null = rawData[5].isNull() ? null : rawData[5].toString()
  let flags: u16 = rawData[6].isNull() ? 0 : (rawData[6].toU64() as u16)

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

      if (isPausable(flags)) {
        PausableToken.create(contractAddress)
      }
    } else {
      log.warning('Token {} already in registry', [contractAddress.toHex()])
    }
  }
}
