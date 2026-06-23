export type AccountServerKind = "canon" | "community" | "development";

export interface AccountServerDescriptor {
  id: string;
  name: string;
  kind: AccountServerKind;
  namespace: string;
  endpoint: string;
  rulesetLabel: string;
}

export interface FederatedAccountSession {
  protocolVersion: "ACCOUNT_SESSION_V1";
  sessionId: string;
  serverId: string;
  accountId: string;
  displayName: string;
  credentialType: string;
}

export interface AccountServerAdapter {
  listServers(): readonly AccountServerDescriptor[];
  signIn(serverId: string, displayName: string): Promise<FederatedAccountSession>;
  signOut(session: FederatedAccountSession): Promise<void>;
}
