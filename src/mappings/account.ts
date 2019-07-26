import { BigDecimal, BigInt, Bytes } from '@graphprotocol/graph-ts'

import { Account, AccountBalance, Token } from '../../generated/schema'

export function getOrCreateAccount(accountAddress: Bytes): Account {
  let accountId = accountAddress.toHex()
  let existingEntity = Account.load(accountId)

  if (existingEntity != null) {
    return existingEntity as Account
  }

  let newEntity = new Account(accountId)
  newEntity.address = accountAddress

  return newEntity
}

export function getOrCreateAccountBalance(account: Account, token: Token): AccountBalance {
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
  // TODO: balance.updated = timestamp

  return balance
}

export function decreaseAccountBalance(account: Account, token: Token, amount: BigDecimal): AccountBalance {
  let balance = getOrCreateAccountBalance(account, token)
  balance.amount = balance.amount.minus(amount)
  // TODO: balance.updated = timestamp

  return balance
}
