// Constants
export const DEFAULT_DECIMALS = 18

// Flags
const DETAILED_TOKEN = 1 << 0
const BURNABLE_TOKEN = 1 << 1
const MINTABLE_TOKEN = 1 << 2

export function decodeFlags(value: u64): string[] {
  let flags: string[] = []

  if (isDetailed(value)) {
    flags.push('detailed')
  }

  if (isBurnable(value)) {
    flags.push('burnable')
  }

  if (isMintable(value)) {
    flags.push('mintable')
  }

  return flags
}

// If token implements optional ERC20 fields
export function isDetailed(flags: u64): boolean {
  return (flags & DETAILED_TOKEN) != 0
}

// If token can be irreversibly destroyed
export function isBurnable(flags: u64): boolean {
  return (flags & BURNABLE_TOKEN) != 0
}

// If token can be created or minted
export function isMintable(flags: u64): boolean {
  return (flags & MINTABLE_TOKEN) != 0
}
