export function standardPulseStep(pulse: number): number {
  return pulse % 2 === 0 ? pulse / 2 : pulse * 3 + 1;
}

export function forcedJumpPulse(pulse: number): number {
  return pulse * 3 + 1;
}
