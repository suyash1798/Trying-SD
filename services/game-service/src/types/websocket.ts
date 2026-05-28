import { WebSocket } from 'ws';

export interface GameSocket extends WebSocket {
  id: string;
  isAlive: boolean;
  roomId: string | null;
  userId: string | null;
  processedRequests: Map<string, object>;
  pendingRequests: Set<string>;
}

export interface JoinPayload {
  action: 'join';
  requestId: string;
  roomId: string;
  token: string;
  userId?: string;
}

export interface SpinPayload {
  action: 'spin';
  requestId: string;
  gameId: string;
  spinId: string;
  betAmount: number;
}

export interface EndRoundPayload {
  action: 'end_round';
  requestId: string;
}

export interface PersistentDataPayload {
  action: 'persistent_data';
  requestId: string;
  gameId: string;
  data: Record<string, unknown>;
}

export type IncomingMessagePayload =
  | JoinPayload
  | SpinPayload
  | EndRoundPayload
  | PersistentDataPayload;

export type OutgoingPayload = Record<string, unknown>;
