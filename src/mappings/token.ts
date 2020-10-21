import { Address, log, BigDecimal, Bytes, EthereumEvent, Value, JSONValue, } from '@graphprotocol/graph-ts'

import { Transfer } from '../../generated/templates/StandardToken/ERC20'
import { Burn } from '../../generated/templates/BurnableToken/Burnable'
import { Mint } from '../../generated/templates/MintableToken/Mintable'
import { Pause, Unpause, Paused, Unpaused } from '../../generated/templates/PausableToken/Pausable'

import { Token, BurnEvent, MintEvent, TransferEvent, PauseEvent } from '../../generated/schema'
import { ERC20 } from '../../generated/TokenRegistry/ERC20'

import { toDecimal, ONE, ZERO } from '../helpers/number'
import { decodeFlags, hasBurnEvent, hasMintEvent, DEFAULT_DECIMALS } from '../helpers/token'
import { BurnableToken, MintableToken, StandardToken } from '../../generated/templates'
import { createToken, IValue } from './registry'

import {
  decreaseAccountBalance,
  getOrCreateAccount,
  increaseAccountBalance,
  saveAccountBalanceSnapshot,
} from './account'

const GENESIS_ADDRESS = '0x0000000000000000000000000000000000000000'
const imageUrl = 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x744d70FDBE2Ba4CF95131626614a1763DF805B9E/logo.png'

export function handleTransfer(event: Transfer): void {
  let token = Token.load(event.address.toHex())

    if (token == null) {
        // createToken(
        //     event.address.toHexString(),
        //     'Status Network Token',
        //     'SNT',
        //     imageUrl
        // )
        // token = Token.load(event.address.toHex())
        let contractAddress = Address.fromString(event.address.toHexString())
        let initialSupply = ERC20.bind(contractAddress).try_totalSupply()
        token = new Token(contractAddress.toHex())
        token.address = contractAddress
        token.name = 'Status Network Token'
        token.symbol = 'SNT'
        token.decimals = DEFAULT_DECIMALS
        token.description = ''
        token.imageUrl = "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x744d70FDBE2Ba4CF95131626614a1763DF805B9E/logo.png"
        token.flags = decodeFlags(0)

        token.eventCount = ZERO
        token.burnEventCount = ZERO
        token.mintEventCount = ZERO
        token.transferEventCount = ZERO
        token.totalSupply = initialSupply.reverted ? ZERO.toBigDecimal() : toDecimal(initialSupply.value, token.decimals)
        token.totalBurned = ZERO.toBigDecimal()
        token.totalMinted = ZERO.toBigDecimal()
        token.totalTransferred = ZERO.toBigDecimal()
        token.save()
    }

  if (token != null) {
      log.info(
          'handleTransfer, token: {}',
          [token.address.toString()]
      )
    let amount = toDecimal(event.params.value, token.decimals)

    let isBurn = token.flags.includes('burnable-transfer') && event.params.to.toHex() == GENESIS_ADDRESS
    let isMint = token.flags.includes('mintable-transfer') && event.params.from.toHex() == GENESIS_ADDRESS
    let isTransfer = !isBurn && !isMint

    // Update token event logs
      let eventEntityId: string

      // log.info(
      //     'isBurn: {}, isMint: {}, isTransafer: {}',
      //     [isBurn ? 'true' : 'false', isMint ? 'true' : 'false', isTransfer ? 'true' : 'false']
      // )

    if (isBurn) {
      let eventEntity = handleBurnEvent(token, amount, event.params.from, event)

      eventEntityId = eventEntity.id
    } else if (isMint) {
      let eventEntity = handleMintEvent(token, amount, event.params.to, event)

      eventEntityId = eventEntity.id
    } else if (isTransfer) {
      let eventEntity = handleTransferEvent(token, amount, event.params.from, event.params.to, event)

      eventEntityId = eventEntity.id
    }

    // Updates balances of accounts
    if (isTransfer || isBurn) {
      let sourceAccount = getOrCreateAccount(event.params.from)

      let accountBalance = decreaseAccountBalance(sourceAccount, token as Token, amount)
      accountBalance.block = event.block.number
      accountBalance.modified = event.block.timestamp
      accountBalance.transaction = event.transaction.hash

      sourceAccount.save()
      accountBalance.save()

      // To provide information about evolution of account balances
      saveAccountBalanceSnapshot(accountBalance, eventEntityId, event)
    }

    if (isTransfer || isMint) {
      let destinationAccount = getOrCreateAccount(event.params.to)

      let accountBalance = increaseAccountBalance(destinationAccount, token as Token, amount)
      accountBalance.block = event.block.number
      accountBalance.modified = event.block.timestamp
      accountBalance.transaction = event.transaction.hash

      destinationAccount.save()
      accountBalance.save()

      // To provide information about evolution of account balances
      saveAccountBalanceSnapshot(accountBalance, eventEntityId, event)
    }
  }
}

export function handleBurn(event: Burn): void {
  let token = Token.load(event.address.toHex())

  if (token != null) {
    let amount = toDecimal(event.params.value, token.decimals)

    // Persist burn event log
    let eventEntity = handleBurnEvent(token, amount, event.params.burner, event)

    // Update source account balance
    let account = getOrCreateAccount(event.params.burner)

    let accountBalance = decreaseAccountBalance(account, token as Token, amount)
    accountBalance.block = event.block.number
    accountBalance.modified = event.block.timestamp
    accountBalance.transaction = event.transaction.hash

    account.save()
    accountBalance.save()

    // To provide information about evolution of account balances
    saveAccountBalanceSnapshot(accountBalance, eventEntity.id, event)
  }
}

export function handleMint(event: Mint): void {
  let token = Token.load(event.address.toHex())

  if (token != null) {
    let amount = toDecimal(event.params.amount, token.decimals)

    // Persist mint event log
    let eventEntity = handleMintEvent(token, amount, event.params.to, event)

    // Update destination account balance
    let account = getOrCreateAccount(event.params.to)

    let accountBalance = increaseAccountBalance(account, token as Token, amount)
    accountBalance.block = event.block.number
    accountBalance.modified = event.block.timestamp
    accountBalance.transaction = event.transaction.hash

    account.save()
    accountBalance.save()

    // To provide information about evolution of account balances
    saveAccountBalanceSnapshot(accountBalance, eventEntity.id, event)
  }
}

export function handlePause(event: Pause): void {
  let token = Token.load(event.address.toHex())

  handlePauseEvent(token, true, event)
}

export function handlePaused(event: Paused): void {
  let token = Token.load(event.address.toHex())

  handlePauseEvent(token, true, event)
}

export function handleUnpause(event: Unpause): void {
  let token = Token.load(event.address.toHex())

  handlePauseEvent(token, false, event)
}

export function handleUnpaused(event: Unpaused): void {
  let token = Token.load(event.address.toHex())

  handlePauseEvent(token, false, event)
}

function handleBurnEvent(token: Token | null, amount: BigDecimal, burner: Bytes, event: EthereumEvent): BurnEvent {
  let burnEvent = new BurnEvent(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  burnEvent.token = event.address.toHex()
  burnEvent.amount = amount
  burnEvent.sender = event.transaction.from
  burnEvent.burner = burner

  burnEvent.block = event.block.number
  burnEvent.timestamp = event.block.timestamp
  burnEvent.transaction = event.transaction.hash

  burnEvent.save()

  // Track total supply/burned
  if (token != null) {
    token.eventCount = token.eventCount.plus(ONE)
    token.burnEventCount = token.burnEventCount.plus(ONE)
    token.totalSupply = token.totalSupply.minus(amount)
    token.totalBurned = token.totalBurned.plus(amount)
    token.save()
  }

  return burnEvent
}

function handleMintEvent(token: Token | null, amount: BigDecimal, destination: Bytes, event: EthereumEvent): MintEvent {
  let mintEvent = new MintEvent(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  mintEvent.token = event.address.toHex()
  mintEvent.amount = amount
  mintEvent.sender = event.transaction.from
  mintEvent.destination = destination
  mintEvent.minter = event.transaction.from

  mintEvent.block = event.block.number
  mintEvent.timestamp = event.block.timestamp
  mintEvent.transaction = event.transaction.hash

  mintEvent.save()

  // Track total token supply/minted
  if (token != null) {
    token.eventCount = token.eventCount.plus(ONE)
    token.mintEventCount = token.mintEventCount.plus(ONE)
    token.totalSupply = token.totalSupply.plus(amount)
    token.totalMinted = token.totalMinted.plus(amount)

    token.save()
  }

  return mintEvent
}

function handleTransferEvent(
  token: Token | null,
  amount: BigDecimal,
  source: Bytes,
  destination: Bytes,
  event: EthereumEvent,
): TransferEvent {
  let transferEvent = new TransferEvent(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  transferEvent.token = event.address.toHex()
  transferEvent.amount = amount
  transferEvent.sender = source
  transferEvent.source = source
  transferEvent.destination = destination

  transferEvent.block = event.block.number
  transferEvent.timestamp = event.block.timestamp
  transferEvent.transaction = event.transaction.hash

  transferEvent.save()

  // Track total token transferred
  if (token != null) {
    token.eventCount = token.eventCount.plus(ONE)
    token.transferEventCount = token.transferEventCount.plus(ONE)
    token.totalTransferred = token.totalTransferred.plus(amount)

    token.save()
  }

  return transferEvent
}

function handlePauseEvent(token: Token | null, paused: boolean, event: EthereumEvent): PauseEvent {
  let pauseEvent = new PauseEvent(event.transaction.hash.toHex() + '-' + event.logIndex.toString())
  pauseEvent.token = event.address.toHex()
  pauseEvent.amount = paused ? ONE.toBigDecimal() : ZERO.toBigDecimal()
  pauseEvent.sender = event.transaction.from
  pauseEvent.pauser = event.transaction.from

  pauseEvent.block = event.block.number
  pauseEvent.timestamp = event.block.timestamp
  pauseEvent.transaction = event.transaction.hash

  pauseEvent.save()

  if (token != null) {
    token.paused = paused

    token.save()
  }

  return pauseEvent
}
