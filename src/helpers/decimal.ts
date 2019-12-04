import { BigDecimal } from '@graphprotocol/graph-ts'
import { BigInt } from '@graphprotocol/graph-ts/index'

export let ZERO = BigDecimal.fromString('0')

export function toDecimal(value: BigInt, decimals: u32): BigDecimal {
  let precision = BigInt.fromI32(10)
    .pow(<u8>decimals)
    .toBigDecimal()

  return value.divDecimal(precision)
}
