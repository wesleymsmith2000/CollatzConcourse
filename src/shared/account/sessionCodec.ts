import type { FederatedAccountSession } from "./types";

export function serializeAccountSession(session: FederatedAccountSession): string {
  return JSON.stringify(session);
}

export function parseAccountSession(value: string | null): FederatedAccountSession | undefined {
  if (!value) return undefined;
  try {
    const candidate = JSON.parse(value) as Partial<FederatedAccountSession>;
    if (
      candidate.protocolVersion !== "ACCOUNT_SESSION_V1" ||
      typeof candidate.credentialType !== "string" ||
      typeof candidate.sessionId !== "string" ||
      typeof candidate.serverId !== "string" ||
      typeof candidate.accountId !== "string" ||
      typeof candidate.displayName !== "string"
    ) {
      return undefined;
    }
    return candidate as FederatedAccountSession;
  } catch {
    return undefined;
  }
}
