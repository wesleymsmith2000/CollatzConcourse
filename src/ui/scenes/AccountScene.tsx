import { Fingerprint, Server, ShieldAlert } from "lucide-react";
import type { AccountServerDescriptor, FederatedAccountSession } from "../../shared/account/types";

export function AccountScene({ session, server }: { session: FederatedAccountSession; server: AccountServerDescriptor }) {
  return (
    <main className="portal-content account-scene">
      <section className="account-heading">
        <p className="eyebrow">Account credential</p>
        <h1>{session.displayName}</h1>
        <code>{session.accountId}</code>
      </section>

      <section className="account-ledger">
        <div>
          <Server size={20} />
          <span>Issuer</span>
          <strong>{server.name}</strong>
          <code>{server.namespace}</code>
        </div>
        <div>
          <Fingerprint size={20} />
          <span>Session</span>
          <strong>Local development</strong>
          <code>{session.sessionId}</code>
        </div>
        <div>
          <ShieldAlert size={20} />
          <span>Collection root</span>
          <strong>Not registered</strong>
          <code>Commitment subsystem pending</code>
        </div>
      </section>
    </main>
  );
}
