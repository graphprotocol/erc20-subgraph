// Constants
export const DEFAULT_DECIMALS = 18

// Flags
const DETAILED_TOKEN = 1 << 0
const BURN_EVENT = 1 << 1
const MINT_EVENT = 1 << 2
const BURN_TRANSFER = 1 << 3
const MINT_TRANSFER = 1 << 4

export function decodeFlags(value: u64): string[] {
  let flags: string[] = []

  if (isDetailed(value)) {
    flags.push('detailed')
  }

  if (isBurnable(value)) {
    flags.push('burnable')

    if (hasBurnEvent(value)) {
      flags.push('burnable-event')
    }

    if (hasBurnTransfer(value)) {
      flags.push('burnable-transfer')
    }
  }

  if (isMintable(value)) {
    flags.push('mintable')

    if (hasMintEvent(value)) {
      flags.push('mintable-event')
    }

    if (hasMintTransfer(value)) {
      flags.push('mintable-transfer')
    }
  }

  return flags
}

// If token contract implements optional ERC20 fields
export function isDetailed(flags: u64): boolean {
  return (flags & DETAILED_TOKEN) != 0
}

// If tokens can be irreversibly destroyed
export function isBurnable(flags: u64): boolean {
  return hasBurnEvent(flags) || hasBurnTransfer(flags)
}

// If token contract emits Burn event when destroy/burn tokens
export function hasBurnEvent(flags: u64): boolean {
  return (flags & BURN_EVENT) != 0
}

// If token contract emits Transfer event to genesis address when destroy/burn tokens
export function hasBurnTransfer(flags: u64): boolean {
  return (flags & BURN_TRANSFER) != 0
}

// If tokens can be created or minted
export function isMintable(flags: u64): boolean {
  return hasMintEvent(flags) || hasMintTransfer(flags)
}

// If token contract emits Mint event when create/mint tokens
export function hasMintEvent(flags: u64): boolean {
  return (flags & MINT_EVENT) != 0
}

// If token contract emits Transfer event from genesis address when create/mint tokens
export function hasMintTransfer(flags: u64): boolean {
  return (flags & MINT_TRANSFER) != 0
}
