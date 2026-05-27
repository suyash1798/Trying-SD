import { IncomingMessagePayload, GameSocket } from '../types/websocket';

class Idempotency {
  public key(ws: GameSocket, payload: IncomingMessagePayload): string | null {
    if (payload.action === 'join') {
      return this.joinKey(payload);
    }

    if (payload.action === 'spin') {
      return this.spinKey(ws, payload);
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
}

export default Idempotency;
