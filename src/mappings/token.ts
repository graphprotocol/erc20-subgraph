import { BigInt, BigDecimal, Bytes, EthereumEvent } from '@graphprotocol/graph-ts'

import { Transfer } from '../../generated/TokenRegistry/templates/StandardToken/ERC20'
import { Burn } from '../../generated/TokenRegistry/templates/BurnableToken/Burnable'
import { Mint } from '../../generated/TokenRegistry/templates/MintableToken/Mintable'

import { Account, BurnEvent, MintEvent, Token, TransferEvent } from '../../generated/schema'

import { getOrCreateAccount, decreaseAccountBalance, increaseAccountBalance } from './account'

const GENESIS_ADDRESS = '0x0000000000000000000000000000000000000000'

export function handleTransfer(event: Transfer): void {
  let token = Token.load(event.address.toHex())

  if (token != null) {
    let amount = toDecimal(event.params.value, token.decimals)

    let isBurn = event.params.to.toHex() == GENESIS_ADDRESS
    let isMint = event.params.from.toHex() == GENESIS_ADDRESS
    let isTransfer = !(isBurn || isMint)

    // Update token event logs
    if (isBurn) {
      let eventEntity = createBurnEvent(event, amount, event.params.from)
      eventEntity.save()
    }

    if (isMint) {
      let eventEntity = createMintEvent(event, amount, event.params.to)
      eventEntity.save()
    }

    if (isTransfer) {
      let eventEntity = createTransferEvent(event, amount, event.params.from, event.params.to)
      eventEntity.save()
    }

    // Updates balances of accounts
    if (isTransfer || isBurn) {
      let sourceAccount = getOrCreateAccount(event.params.from)
      let accountBalance = decreaseAccountBalance(sourceAccount, token as Token, amount)

      sourceAccount.save()
      accountBalance.save()
    }

    if (isTransfer || isMint) {
      let destinationAccount = getOrCreateAccount(event.params.to)
      let accountBalance = increaseAccountBalance(destinationAccount, token as Token, amount)

      destinationAccount.save()
      accountBalance.save()
    }
  }
}

export function handleBurn(event: Burn): void {
  let token = Token.load(event.address.toHex())

  if (token != null) {
    let amount = toDecimal(event.params.value, token.decimals)

    // Persist burn event log
    let eventEntity = createBurnEvent(event, amount, event.params.burner)
    eventEntity.save()

    // Update source account balance
    let account = getOrCreateAccount(event.params.burner)
    account.save()

    let accountBalance = decreaseAccountBalance(account, token as Token, amount)
    accountBalance.save()
  }
}

export function handleMint(event: Mint): void {
  let token = Token.load(event.address.toHex())

  if (token != null) {
    let amount = toDecimal(event.params.amount, token.decimals)

    // Persist mint event log
    let eventEntity = createMintEvent(event, amount, event.params.to)
    eventEntity.save()

    // Update destination account balance
    let account: Account = getOrCreateAccount(event.params.to)
    account.save()

    let accountBalance = increaseAccountBalance(account, token as Token, amount)
    accountBalance.save()
  }
}

function createBurnEvent(event: EthereumEvent, amount: BigDecimal, burner: Bytes): BurnEvent {
  let eventEntity = new BurnEvent(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  eventEntity.token = event.address.toHex()
  eventEntity.amount = amount
  eventEntity.sender = event.transaction.from
  eventEntity.burner = burner

  eventEntity.block = event.block.number
  eventEntity.transaction = event.transaction.hash
  eventEntity.timestamp = event.block.timestamp

  return eventEntity
}

function createMintEvent(event: EthereumEvent, amount: BigDecimal, destination: Bytes): MintEvent {
  let eventEntity = new MintEvent(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  eventEntity.token = event.address.toHex()
  eventEntity.amount = amount
  eventEntity.sender = event.transaction.from
  eventEntity.destination = destination
  eventEntity.minter = event.transaction.from

  eventEntity.block = event.block.number
  eventEntity.transaction = event.transaction.hash
  eventEntity.timestamp = event.block.timestamp

  return eventEntity
}

function createTransferEvent(
  event: EthereumEvent,
  amount: BigDecimal,
  source: Bytes,
  destination: Bytes
): TransferEvent {
  let eventEntity = new TransferEvent(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  eventEntity.token = event.address.toHex()
  eventEntity.amount = amount
  eventEntity.sender = source
  eventEntity.source = source
  eventEntity.destination = destination

  eventEntity.block = event.block.number
  eventEntity.transaction = event.transaction.hash
  eventEntity.timestamp = event.block.timestamp

  return eventEntity
}

function toDecimal(value: BigInt, decimals: u32): BigDecimal {
  let precision = BigInt.fromI32(10)
    .pow(<u8>decimals)
    .toBigDecimal()

  return value.divDecimal(precision)
}
