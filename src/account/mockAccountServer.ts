import type { AccountServerAdapter, AccountServerDescriptor, FederatedAccountSession } from "../shared/account/types";

export const MOCK_ACCOUNT_SERVERS: readonly AccountServerDescriptor[] = [
  {
    id: "canon-local",
    name: "Concourse Canon",
    kind: "canon",
    namespace: "cc://canon",
    endpoint: "local://canon",
    rulesetLabel: "Canon development lineage"
  },
  {
    id: "aurora-local",
    name: "Aurora League",
    kind: "community",
    namespace: "cc://aurora-league",
    endpoint: "local://aurora-league",
    rulesetLabel: "Community open format"
  },
  {
    id: "workshop-local",
    name: "Rules Workshop",
    kind: "development",
    namespace: "cc://development",
    endpoint: "local://development",
    rulesetLabel: "Experimental cards and rules"
  }
];

export const mockAccountServerAdapter: AccountServerAdapter = {
  listServers() {
    return MOCK_ACCOUNT_SERVERS;
  },

  async signIn(serverId, displayName) {
    const server = MOCK_ACCOUNT_SERVERS.find((candidate) => candidate.id === serverId);
    if (!server) throw new Error("The selected account server is unavailable.");
    const normalizedName = displayName.trim().replace(/\s+/g, " ");
    if (normalizedName.length < 2 || normalizedName.length > 24) {
      throw new Error("Pilot handles must contain 2 to 24 characters.");
    }
    if (!/^[a-zA-Z0-9 _-]+$/.test(normalizedName)) {
      throw new Error("Pilot handles may use letters, numbers, spaces, hyphens, and underscores.");
    }
    const accountSlug = normalizedName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return {
      protocolVersion: "ACCOUNT_SESSION_V1",
      sessionId: `local-session:${server.id}:${accountSlug}`,
      serverId: server.id,
      accountId: `${server.namespace}/accounts/${accountSlug}`,
      displayName: normalizedName,
      credentialType: "local-development"
    } satisfies FederatedAccountSession;
  },

  async signOut() {
    return Promise.resolve();
  }
};
