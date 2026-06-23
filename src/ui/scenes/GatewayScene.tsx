import { useState, type FormEvent } from "react";
import { RadioTower, Server, UserRound } from "lucide-react";
import type { AccountServerDescriptor, FederatedAccountSession } from "../../shared/account/types";

export function GatewayScene({
  servers,
  onSignIn
}: {
  servers: readonly AccountServerDescriptor[];
  onSignIn: (serverId: string, displayName: string) => Promise<FederatedAccountSession>;
}) {
  const [serverId, setServerId] = useState(servers[0]?.id ?? "");
  const [displayName, setDisplayName] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string>();

  async function submit(event: FormEvent) {
    event.preventDefault();
    setConnecting(true);
    setError(undefined);
    try {
      await onSignIn(serverId, displayName);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to establish the account session.");
    } finally {
      setConnecting(false);
    }
  }

  return (
    <main className="gateway-scene">
      <div className="gateway-backdrop" aria-hidden="true" />
      <section className="gateway-console" aria-labelledby="gateway-title">
        <header>
          <div className="gateway-mark"><RadioTower size={24} /></div>
          <div>
            <p className="eyebrow">Federated Account Gateway</p>
            <h1 id="gateway-title">Collatz Concourse</h1>
          </div>
        </header>

        <form onSubmit={submit}>
          <fieldset className="server-selector">
            <legend>Account server</legend>
            {servers.map((server) => (
              <label key={server.id} className={server.id === serverId ? "selected" : ""}>
                <input
                  type="radio"
                  name="account-server"
                  value={server.id}
                  checked={server.id === serverId}
                  onChange={() => setServerId(server.id)}
                />
                <Server size={18} />
                <span>
                  <strong>{server.name}</strong>
                  <small>{server.kind} / {server.rulesetLabel}</small>
                </span>
              </label>
            ))}
          </fieldset>

          <label className="gateway-field">
            <span>Pilot handle</span>
            <div>
              <UserRound size={17} />
              <input
                value={displayName}
                maxLength={24}
                autoComplete="username"
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Enter account handle"
              />
            </div>
          </label>

          {error && <p className="gateway-error" role="alert">{error}</p>}
          <button type="submit" className="primary" disabled={connecting || !serverId}>
            <RadioTower size={17} /> {connecting ? "Connecting" : "Connect account"}
          </button>
        </form>

        <footer>
          <span>Local development credential</span>
          <code>ACCOUNT_ADAPTER_V1</code>
        </footer>
      </section>
    </main>
  );
}
