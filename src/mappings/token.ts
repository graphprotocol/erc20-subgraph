import { log } from '@graphprotocol/graph-ts'

import * as schema from '../../generated/schema'

import { Transfer } from '../../generated/TokenRegistry/templates/StandardToken/ERC20'
import { Burn } from '../../generated/TokenRegistry/templates/BurnableToken/Burnable'
import { Mint } from '../../generated/TokenRegistry/templates/MintableToken/Mintable'

export function handleTransfer(event: Transfer): void {
  log.debug('Handling token transfer, address={}', [event.address.toHex()])

  let entity = new schema.TransferEvent(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.token = event.address.toHex()
  entity.amount = event.params.value
  entity.sender = event.params.from
  entity.source = event.params.from
  entity.destination = event.params.to

  entity.save()
}

export function handleBurn(event: Burn): void {
  log.debug('Handling token burn, address={}', [event.address.toHex()])

  let entity = new schema.BurnEvent(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.token = event.address.toHex()
  entity.amount = event.params.value
  entity.sender = event.transaction.from
  entity.burner = event.params.burner

  entity.save()
}

export function handleMint(event: Mint): void {
  log.debug('Handling token mint, address={}', [event.address.toHex()])

  let entity = new schema.MintEvent(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  entity.token = event.address.toHex()
  entity.amount = event.params.amount
  entity.sender = event.transaction.from
  entity.destination = event.params.to
  entity.minter = event.transaction.from

  entity.save()
}
