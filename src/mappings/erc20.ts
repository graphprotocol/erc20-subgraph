import * as schema from '../../generated/schema'
import { Transfer } from '../../generated/TokenRegistry/templates/ERC20Token/ERC20'

export function handleTransfer(event: Transfer): void {
  let id = event.transaction.hash.toString() + '-' + event.logIndex.toString()

  let entity = new schema.TransferEvent(id)
  entity.token = event.address
  entity.from = event.params.from
  entity.to = event.params.to
  entity.amount = event.params.value

  entity.save()
}
