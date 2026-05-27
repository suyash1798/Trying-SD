import { WebSocket } from 'ws';

export interface GameSocket extends WebSocket {
  id: string;
  isAlive: boolean;
  roomId: string | null;
  userId: string | null;
  processedRequests: Map<string, object>;
  pendingRequests: Set<string>;
}

export interface IncomingMessagePayload {
  action: GameAction;
  userId?: string;
  roomId?: string;
  gameId?: string;
  data?: Record<string, unknown>;
  roundId?: string;
  spinId?: string;
  betAmount?: number;
  requestId?: string;
}

enum GameAction{
  JOIN = 'join',
  SPIN = 'spin',
  END_ROUND = 'end_round',
  PERSISTENT_DATA = 'persistent_data'
}

export type OutgoingPayload = Record<string, unknown>;
