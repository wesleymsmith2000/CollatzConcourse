import { ArrowRight, Gamepad2, RadioTower, ShieldCheck } from "lucide-react";
import type { AccountServerDescriptor, FederatedAccountSession } from "../../shared/account/types";

export function HubScene({
  session,
  server,
  onEnterRace
}: {
  session: FederatedAccountSession;
  server: AccountServerDescriptor;
  onEnterRace: () => void;
}) {
  return (
    <main className="portal-content hub-scene">
      <section className="hub-heading">
        <p className="eyebrow">Connected / {server.namespace}</p>
        <h1>Concourse Event Terminal</h1>
        <div className="connection-strip">
          <RadioTower size={17} />
          <span>{server.name}</span>
          <strong>{session.displayName}</strong>
          <code>{server.endpoint}</code>
        </div>
      </section>

      <section className="event-board" aria-label="Available events">
        <article className="event-entry live">
          <div className="event-symbol"><Gamepad2 size={28} /></div>
          <div>
            <span className="event-state">Playable / Local</span>
            <h2>Singularity Circuit</h2>
            <p>Collatz pulse racing for two to four human or heuristic pilots.</p>
          </div>
          <button type="button" className="primary" onClick={onEnterRace}>
            Enter race <ArrowRight size={17} />
          </button>
        </article>

        <article className="event-entry protocol-entry">
          <div className="event-symbol"><ShieldCheck size={28} /></div>
          <div>
            <span className="event-state">Protocol staging</span>
            <h2>Constructed Concourse</h2>
            <p>Account collections, registered decks, Devices, Events, and automatic Snares.</p>
          </div>
          <span className="protocol-chip">Architecture phase</span>
        </article>
      </section>
    </main>
  );
}
