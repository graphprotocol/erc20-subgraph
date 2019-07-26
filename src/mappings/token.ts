import { BigInt, BigDecimal, Bytes, EthereumEvent } from '@graphprotocol/graph-ts'

import * as schema from '../../generated/schema'

import { Transfer } from '../../generated/TokenRegistry/templates/StandardToken/ERC20'
import { Burn } from '../../generated/TokenRegistry/templates/BurnableToken/Burnable'
import { Mint } from '../../generated/TokenRegistry/templates/MintableToken/Mintable'

const GENESIS_ADDRESS = '0x0000000000000000000000000000000000000000'

export function handleTransfer(event: Transfer): void {
  let token = schema.Token.load(event.address.toHex())

  if (token) {
    let amount = toDecimal(event.params.value, token.decimals)

    if (event.params.from.toHex() === GENESIS_ADDRESS) {
      let entity = mintEvent(event, amount, event.params.to)
      entity.save()
    } else if (event.params.to.toHex() === GENESIS_ADDRESS) {
      let entity = burnEvent(event, amount, event.params.from)
      entity.save()
    } else {
      let entity = transferEvent(event, amount, event.params.from, event.params.to)
      entity.save()
    }
  }
}

export function handleBurn(event: Burn): void {
  let token = schema.Token.load(event.address.toHex())

  if (token) {
    let amount = toDecimal(event.params.value, token.decimals)
    let entity = burnEvent(event, amount, event.params.burner)

    entity.save()
  }
}

export function handleMint(event: Mint): void {
  let token = schema.Token.load(event.address.toHex())

  if (token) {
    let amount = toDecimal(event.params.amount, token.decimals)
    let entity = mintEvent(event, amount, event.params.to)

    entity.save()
  }
}

function burnEvent(event: EthereumEvent, amount: BigDecimal, burner: Bytes): schema.BurnEvent {
  let entity = new schema.BurnEvent(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.token = event.address.toHex()
  entity.amount = amount
  entity.sender = event.transaction.from
  entity.burner = burner

  entity.block = event.block.number
  entity.transaction = event.transaction.hash
  entity.timestamp = event.block.timestamp

  return entity
}

function mintEvent(event: EthereumEvent, amount: BigDecimal, destination: Bytes): schema.MintEvent {
  let entity = new schema.MintEvent(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.token = event.address.toHex()
  entity.amount = amount
  entity.sender = event.transaction.from
  entity.destination = destination
  entity.minter = event.transaction.from

  entity.block = event.block.number
  entity.transaction = event.transaction.hash
  entity.timestamp = event.block.timestamp

  return entity
}

function transferEvent(
  event: EthereumEvent,
  amount: BigDecimal,
  source: Bytes,
  destination: Bytes
): schema.TransferEvent {
  let entity = new schema.TransferEvent(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.token = event.address.toHex()
  entity.amount = amount
  entity.sender = source
  entity.source = source
  entity.destination = destination

  entity.block = event.block.number
  entity.transaction = event.transaction.hash
  entity.timestamp = event.block.timestamp

  return entity
}

function toDecimal(value: BigInt, decimals: u32): BigDecimal {
  let precision = BigInt.fromI32(10)
    .pow(<u8>decimals)
    .toBigDecimal()

  return value.divDecimal(precision)
}
