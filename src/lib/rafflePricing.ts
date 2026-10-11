export function getRaffleNumberPrice(configuredPrice: number | { toString(): string }): number {
  return Number(configuredPrice);
}

