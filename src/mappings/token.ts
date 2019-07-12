import { log } from '@graphprotocol/graph-ts'

import * as schema from '../../generated/schema'
import { Transfer } from '../../generated/TokenRegistry/templates/StandardToken/ERC20'

export function handleTransfer(event: Transfer): void {
  log.warning('Handling token transfer, address={}', [event.address.toHex()])

  let entity = new schema.TransferEvent(event.transaction.hash.toString() + '-' + event.logIndex.toString())
  entity.token = event.address
  entity.from = event.params.from
  entity.to = event.params.to
  entity.amount = event.params.value

  entity.save()
}
