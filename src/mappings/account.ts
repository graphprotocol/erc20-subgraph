import { BigDecimal, BigInt, Bytes, EthereumEvent } from '@graphprotocol/graph-ts'

import { Account, AccountBalance, AccountBalanceSnapshot, Token } from '../../generated/schema'

export function getOrCreateAccount(accountAddress: Bytes): Account {
  let accountId = accountAddress.toHex()
  let existingAccount = Account.load(accountId)

  if (existingAccount != null) {
    return existingAccount as Account
  }

  let newAccount = new Account(accountId)
  newAccount.address = accountAddress

  return newAccount
}

function getOrCreateAccountBalance(account: Account, token: Token): AccountBalance {
  let balanceId = account.id + '-' + token.id
  let previousBalance = AccountBalance.load(balanceId)

  if (previousBalance != null) {
    return previousBalance as AccountBalance
  }

  let newBalance = new AccountBalance(balanceId)
  newBalance.account = account.id
  newBalance.token = token.id
  newBalance.amount = BigInt.fromI32(0).toBigDecimal()

  return newBalance
}

export function increaseAccountBalance(account: Account, token: Token, amount: BigDecimal): AccountBalance {
  let balance = getOrCreateAccountBalance(account, token)
  balance.amount = balance.amount.plus(amount)

  return balance
}

export function decreaseAccountBalance(account: Account, token: Token, amount: BigDecimal): AccountBalance {
  let balance = getOrCreateAccountBalance(account, token)
  balance.amount = balance.amount.minus(amount)

  return balance
}

export function saveAccountBalanceSnapshot(balance: AccountBalance, eventId: string, event: EthereumEvent): void {
  let snapshot = new AccountBalanceSnapshot(balance.id + '-' + event.block.timestamp.toString())
  snapshot.account = balance.account
  snapshot.token = balance.token
  snapshot.amount = balance.amount

  snapshot.block = event.block.number
  snapshot.transaction = event.transaction.hash
  snapshot.timestamp = event.block.timestamp

  snapshot.event = eventId

  snapshot.save()
}
