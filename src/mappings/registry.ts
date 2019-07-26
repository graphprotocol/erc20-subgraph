import { Address, JSONValue, Value, log, ipfs } from '@graphprotocol/graph-ts'

import { Token } from '../../generated/schema'
import { Unknown } from '../../generated/TokenRegistry/TokenRegistry'
import { BurnableToken, MintableToken, StandardToken } from '../../generated/TokenRegistry/templates'

const DEFAULT_DECIMALS = 18
const REGISTRY_HASH = 'QmUZ732EtRbQSXWGDtHwnQF68vbn1EGq1czapr4EYFpWDJ'

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
  let flags: u64 = rawData[6].isNull() ? 0 : rawData[6].toU64()

  if (address) {
    let contractAddress = Address.fromString(address)

    let token = Token.load(contractAddress.toHex())

    if (!token) {
      token = new Token(contractAddress.toHex())
      token.address = contractAddress
      token.name = name
      token.symbol = symbol
      token.decimals = decimals
      token.description = description
      token.imageUrl = imageUrl
      token.flags = decodeFlags(flags)

      log.debug('Adding token to registry, name: {}, symbol: {}, address: {}, decimals: {}, flags: {}', [
        token.name,
        token.symbol,
        token.id,
        decimals.toString(), // TODO: use token.decimals.toString() when type 'i32' implements toString()
        token.flags.length ? token.flags.join('|') : 'none'
      ])

      token.save()

      // Start indexing token events
      StandardToken.create(contractAddress)

      if (isBurnable(flags)) {
        BurnableToken.create(contractAddress)
      }

      if (isMintable(flags)) {
        MintableToken.create(contractAddress)
      }
    } else {
      log.warning('Token {} already in registry', [contractAddress.toHex()])
    }
  }
}

function decodeFlags(value: u64): string[] {
  let flags: string[] = []

  if (isDetailed(value)) {
    flags.push('detailed')
  }

  if (isBurnable(value)) {
    flags.push('burnable')
  }

  if (isMintable(value)) {
    flags.push('mintable')
  }

  return flags
}

// If token implements optional ERC20 fields
function isDetailed(flags: u64): boolean {
  return (flags & (2 << 0)) != 0
}

// If token can be irreversibly destroyed
function isBurnable(flags: u64): boolean {
  return (flags & (2 << 1)) != 0
}

// If token can be created or minted
function isMintable(flags: u64): boolean {
  return (flags & (2 << 3)) != 0
}
