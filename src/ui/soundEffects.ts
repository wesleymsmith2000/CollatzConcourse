import { useCallback, useRef, useState } from "react";
import type { GameAction, GameState } from "../engine";

const soundFiles = {
  arrival: "ConcourseArrivalTone.mp3",
  attackFail: "AttackFail.mp3",
  attackSuccess: "AttackSuccess.mp3",
  capture: "SuccessNotice1.mp3",
  damage: "DefeatedWarpPowerDown.mp3",
  endTurn: "Futuristic Door Slides Closed.mp3",
  error: "ErrorBuzz1.mp3",
  forcedJump: "QuickJump.mp3",
  modifyPulse: "StaticGlitchJump.mp3",
  startTurn: "WarpDriveInitialize.mp3",
  theft: "SuccessNotice2.mp3",
  victory: "VictoryTone1.mp3"
} as const;

export type SoundEffect = keyof typeof soundFiles;

export function soundForTransition(previous: GameState, next: GameState, action: GameAction): SoundEffect | undefined {
  if (next.winnerId && next.winnerId !== previous.winnerId) return "victory";

  const latestMessage = next.eventLog[next.eventLog.length - 1]?.message ?? "";
  if (/not available|cannot|lacks|needs|does not have/.test(latestMessage)) return "error";

  switch (action.type) {
    case "startTurn":
      return "startTurn";
    case "capturePrime":
      return "capture";
    case "forcedJump":
      return "forcedJump";
    case "modifyPulse":
      return "modifyPulse";
    case "dividePulse":
      return "modifyPulse";
    case "attack":
      return next.pendingCombatChoice?.victorId === previous.players[previous.activePlayerIndex].id
        ? "attackSuccess"
        : "attackFail";
    case "applyDamage":
      return "damage";
    case "stealPrime":
      return "theft";
    case "endTurn":
      return "endTurn";
  }
}

export function useSoundEffects() {
  const cache = useRef(new Map<SoundEffect, HTMLAudioElement>());
  const [muted, setMuted] = useState(false);

  const play = useCallback(
    (effect: SoundEffect) => {
      if (muted) return;
      let audio = cache.current.get(effect);
      if (!audio) {
        audio = new Audio(`/assets/SoundEffects/${encodeURIComponent(soundFiles[effect])}`);
        audio.volume = 0.65;
        cache.current.set(effect, audio);
      }
      audio.currentTime = 0;
      void audio.play().catch(() => undefined);
    },
    [muted]
  );

  const playTransition = useCallback(
    (previous: GameState, next: GameState, action: GameAction) => {
      const effect = soundForTransition(previous, next, action);
      if (effect) play(effect);
    },
    [play]
  );

  return { muted, play, playTransition, setMuted };
}
