import { BigInt, BigDecimal, log } from '@graphprotocol/graph-ts'

import * as schema from '../../generated/schema'

import { Transfer } from '../../generated/TokenRegistry/templates/StandardToken/ERC20'
import { Burn } from '../../generated/TokenRegistry/templates/BurnableToken/Burnable'
import { Mint } from '../../generated/TokenRegistry/templates/MintableToken/Mintable'

export function handleTransfer(event: Transfer): void {
  let token = schema.Token.load(event.address.toHex())

  let entity = new schema.TransferEvent(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.token = event.address.toHex()
  entity.amount = toDecimal(event.params.value, token.decimals)
  entity.sender = event.params.from
  entity.source = event.params.from
  entity.destination = event.params.to

  entity.block = event.block.number
  entity.transaction = event.transaction.hash
  entity.timestamp = event.block.timestamp

  entity.save()
}

export function handleBurn(event: Burn): void {
  let token = schema.Token.load(event.address.toHex())

  let entity = new schema.BurnEvent(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.token = event.address.toHex()
  entity.amount = toDecimal(event.params.value, token.decimals)
  entity.sender = event.transaction.from
  entity.burner = event.params.burner

  entity.block = event.block.number
  entity.transaction = event.transaction.hash
  entity.timestamp = event.block.timestamp

  entity.save()
}

export function handleMint(event: Mint): void {
  let token = schema.Token.load(event.address.toHex())

  let entity = new schema.MintEvent(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.token = event.address.toHex()
  entity.amount = toDecimal(event.params.amount, token.decimals)
  entity.sender = event.transaction.from
  entity.destination = event.params.to
  entity.minter = event.transaction.from

  entity.block = event.block.number
  entity.transaction = event.transaction.hash
  entity.timestamp = event.block.timestamp

  entity.save()
}

function toDecimal(value: BigInt, decimals: u32): BigDecimal {
  let precision = BigInt.fromI32(10)
    .pow(<u8>decimals)
    .toBigDecimal()

  return value.divDecimal(precision)
}
