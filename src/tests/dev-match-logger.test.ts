import { describe, expect, it } from "vitest";
import { applyAction, createInitialState } from "../engine";
import {
  DEV_MATCH_LOG_STORAGE_KEY,
  appendDevMatchAction,
  createDevMatchLog,
  loadDevMatchArchive,
  saveDevMatchLog
} from "../ui/devMatchLogger";

describe("development match logger", () => {
  it("records serializable actions, metrics, and resulting events", () => {
    const previous = createInitialState(2);
    const action = { type: "startTurn" as const, rollDie: () => 4 };
    const next = applyAction(previous, action);
    const log = appendDevMatchAction(
      createDevMatchLog(previous, "2026-06-23T00:00:00.000Z", "match-1"),
      previous,
      next,
      action,
      "ai",
      "2026-06-23T00:00:01.000Z"
    );

    expect(log.actions).toHaveLength(1);
    expect(log.actions[0].action).toEqual({ type: "startTurn" });
    expect(log.actions[0].source).toBe("ai");
    expect(log.actions[0].before[0].pulse).toBe(1);
    expect(log.actions[0].after[0].pulse).toBe(4);
    expect(log.actions[0].resultingEvents).toHaveLength(2);
  });

  it("archives an active match as interrupted when a new race begins", () => {
    const storage = new MemoryStorage();
    const state = createInitialState(2);
    const started = applyAction(state, { type: "startTurn", rollDie: () => 4 });
    const first = appendDevMatchAction(
      createDevMatchLog(state, "2026-06-23T00:00:00.000Z", "match-1"),
      state,
      started,
      { type: "startTurn" },
      "human"
    );
    const second = createDevMatchLog(state, "2026-06-23T00:01:00.000Z", "match-2");

    saveDevMatchLog(storage, first);
    const archive = saveDevMatchLog(storage, second, "2026-06-23T00:01:00.000Z");

    expect(archive.active?.id).toBe("match-2");
    expect(archive.matches[0]).toMatchObject({ id: "match-1", status: "interrupted" });
  });

  it("recovers safely from malformed local storage", () => {
    const storage = new MemoryStorage();
    storage.setItem(DEV_MATCH_LOG_STORAGE_KEY, "not-json");
    expect(loadDevMatchArchive(storage)).toEqual({ version: 1, matches: [] });
  });
});

class MemoryStorage {
  private values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}
