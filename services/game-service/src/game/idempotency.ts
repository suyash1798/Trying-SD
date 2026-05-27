import { IncomingMessagePayload, GameSocket } from '../types/websocket';

class Idempotency {
  public key(ws: GameSocket, payload: IncomingMessagePayload): string | null {
    if (payload.action === 'join') {
      return this.joinKey(payload);
    }

    if (payload.action === 'spin') {
      return this.spinKey(ws, payload);
    }

    if (payload.action === 'end_round') {
      return this.endRoundKey(ws, payload);
    }

    if (payload.action === 'persistent_data') {
      return this.persistentDataKey(ws, payload);
    }

    return null;
  }

  private joinKey(payload: IncomingMessagePayload): string | null {
    if (!payload.requestId || !payload.userId || !payload.roomId) {
      return null;
    }

    return `join:${payload.userId}:${payload.roomId}:${payload.requestId}`;
  }

  private spinKey(ws: GameSocket, payload: IncomingMessagePayload): string | null {
    const userId = ws.userId || payload.userId;

    if (!userId || !payload.spinId) {
      return null;
    }

    return `spin:${userId}:${payload.spinId}`;
  }

  private endRoundKey(ws: GameSocket, payload: IncomingMessagePayload): string | null {
    if (!payload.requestId || !ws.userId || !ws.roomId) {
      return null;
    }

    return `end-round:${ws.userId}:${ws.roomId}:${payload.requestId}`;
  }

  private persistentDataKey(ws: GameSocket, payload: IncomingMessagePayload): string | null {
    if (!payload.requestId || !ws.userId || !payload.gameId) {
      return null;
    }

    return `persistent-data:${ws.userId}:${payload.gameId}:${payload.requestId}`;
  }
}

export default Idempotency;
