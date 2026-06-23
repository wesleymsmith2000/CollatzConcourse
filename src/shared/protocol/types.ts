import type { CanonicalValue } from "./canonical";

export interface ProtocolCommand<TParameters extends CanonicalValue = CanonicalValue> {
  protocolVersion: string;
  matchId: string;
  turnNumber: number;
  actionSequenceNumber: number;
  actorId: string;
  actionType: string;
  publicParameters: TParameters;
  previousStateHash: string;
  signature: string;
}

export interface ProtocolEvent<TPayload extends CanonicalValue = CanonicalValue> {
  protocolVersion: string;
  eventIndex: number;
  matchId: string;
  type: string;
  payload: TPayload;
  previousEventHash: string;
  resultingStateHash: string;
}

export type ValidationResult<T> =
  | { accepted: true; value: T }
  | { accepted: false; code: string; message: string };
