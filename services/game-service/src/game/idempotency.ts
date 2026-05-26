import { createHash } from 'crypto';
import { IncomingMessagePayload, GameSocket } from '../types/websocket';

export function idempotencyKey(ws: GameSocket, payload: IncomingMessagePayload): string | null {
  if (!payload.requestId) {
    return null;
  }

  if (payload.action !== 'spin') {
    return payload.requestId;
  }

  const userId = ws.userId;

  if (!userId) {
    return payload.requestId;
  }

  return `${userId}-${payloadHash(payload)}-${payload.requestId}`;
}

function payloadHash(payload: IncomingMessagePayload): string {
  const businessPayload = {
    action: payload.action,
    roundId: payload.roundId,
    betAmount: payload.betAmount
  };

  return createHash('sha256')
    .update(JSON.stringify(businessPayload))
    .digest('hex')
    .slice(0, 16);
}
