import { Transfer } from '../../generated/TokenRegistry/templates/ERC20Token/ERC20'
import { Token, TransferEvent } from '../../generated/schema'

export function handleTransfer(event: Transfer): void {
  let id = event.address.toHex() + '-' + event.block.timestamp.toString()

  let token = Token.load(event.address.toHex())

  if (token) {
    let transfer = new TransferEvent(id)

    transfer.from = event.params.from
    transfer.from = event.params.to
    transfer.amount = event.params.value

    transfer.save()
  }
}
