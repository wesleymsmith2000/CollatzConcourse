import { useEffect, useState } from "react";
import { Gamepad2, Home, LogOut, Server, UserRound } from "lucide-react";
import GameScene from "./App";
import { mockAccountServerAdapter } from "./account/mockAccountServer";
import {
  parseAccountSession,
  serializeAccountSession
} from "./shared/account/sessionCodec";
import type { FederatedAccountSession } from "./shared/account/types";
import { AccountScene } from "./ui/scenes/AccountScene";
import { GatewayScene } from "./ui/scenes/GatewayScene";
import { HubScene } from "./ui/scenes/HubScene";

type PortalScene = "hub" | "race" | "account";
const ACCOUNT_SESSION_STORAGE_KEY = "collatz-concourse.account-session.v1";

function loadSession(): FederatedAccountSession | undefined {
  if (typeof window === "undefined") return undefined;
  return parseAccountSession(window.localStorage.getItem(ACCOUNT_SESSION_STORAGE_KEY));
}

export default function Portal() {
  const [session, setSession] = useState<FederatedAccountSession | undefined>(loadSession);
  const [scene, setScene] = useState<PortalScene>("hub");
  const servers = mockAccountServerAdapter.listServers();
  const server = session ? servers.find((candidate) => candidate.id === session.serverId) : undefined;

  useEffect(() => {
    if (session) {
      window.localStorage.setItem(ACCOUNT_SESSION_STORAGE_KEY, serializeAccountSession(session));
    } else {
      window.localStorage.removeItem(ACCOUNT_SESSION_STORAGE_KEY);
    }
  }, [session]);

  async function signIn(serverId: string, displayName: string) {
    const nextSession = await mockAccountServerAdapter.signIn(serverId, displayName);
    setSession(nextSession);
    setScene("hub");
    return nextSession;
  }

  async function signOut() {
    if (session) await mockAccountServerAdapter.signOut(session);
    setSession(undefined);
    setScene("hub");
  }

  if (!session || !server) return <GatewayScene servers={servers} onSignIn={signIn} />;

  return (
    <div className="portal-shell">
      <header className="portal-bar">
        <button type="button" className="portal-brand" onClick={() => setScene("hub")}>
          <Server size={18} />
          <span><strong>Collatz Concourse</strong><small>{server.name}</small></span>
        </button>
        <nav role="tablist" aria-label="Concourse scenes">
          <button type="button" role="tab" aria-selected={scene === "hub"} onClick={() => setScene("hub")}>
            <Home size={16} /> Hub
          </button>
          <button type="button" role="tab" aria-selected={scene === "race"} onClick={() => setScene("race")}>
            <Gamepad2 size={16} /> Race
          </button>
          <button type="button" role="tab" aria-selected={scene === "account"} onClick={() => setScene("account")}>
            <UserRound size={16} /> Account
          </button>
        </nav>
        <button type="button" className="portal-signout" onClick={() => void signOut()} title="Sign out">
          <LogOut size={16} /> Sign out
        </button>
      </header>

      {scene === "hub" && <HubScene session={session} server={server} onEnterRace={() => setScene("race")} />}
      {scene === "race" && <GameScene accountDisplayName={session.displayName} />}
      {scene === "account" && <AccountScene session={session} server={server} />}
    </div>
  );
}
