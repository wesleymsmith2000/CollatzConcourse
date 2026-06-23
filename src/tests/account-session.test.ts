import { describe, expect, it } from "vitest";
import { mockAccountServerAdapter } from "../account/mockAccountServer";
import { parseAccountSession, serializeAccountSession } from "../shared/account/sessionCodec";

describe("mock federated account sessions", () => {
  it("creates a namespaced local development credential", async () => {
    const session = await mockAccountServerAdapter.signIn("aurora-local", "  Nova Pilot  ");
    expect(session.displayName).toBe("Nova Pilot");
    expect(session.accountId).toBe("cc://aurora-league/accounts/nova-pilot");
    expect(session.credentialType).toBe("local-development");
  });

  it("rejects unknown servers and invalid handles", async () => {
    await expect(mockAccountServerAdapter.signIn("unknown", "Nova")).rejects.toThrow("unavailable");
    await expect(mockAccountServerAdapter.signIn("canon-local", "!")).rejects.toThrow("2 to 24");
  });

  it("round-trips valid sessions and rejects malformed storage", async () => {
    const session = await mockAccountServerAdapter.signIn("canon-local", "Mira");
    expect(parseAccountSession(serializeAccountSession(session))).toEqual(session);
    expect(parseAccountSession("not-json")).toBeUndefined();
    expect(parseAccountSession('{"version":2}')).toBeUndefined();
  });
});
