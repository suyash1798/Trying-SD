import AppError from '../../errors/AppError';
import { IncomingMessagePayload, GameSocket } from '../../types/websocket';
import { ActionContext, remember, RequestTrace } from './types';

export async function persistentDataAction(
  ws: GameSocket,
  payload: IncomingMessagePayload,
  context: ActionContext,
  trace: RequestTrace,
  startedAt: number,
  idempotencyKey: string | null
): Promise<void> {
  const { requestId, gameId, data } = payload;

  if (!requestId) {
    context.logger.failed(trace, startedAt, 'requestId required');
    context.responder.error(ws, 'requestId required');
    return;
  }

  if (!ws.userId) {
    context.logger.failed(trace, startedAt, 'join required');
    context.responder.error(ws, 'join required', requestId);
    return;
  }

  if (!gameId || !data || Array.isArray(data) || typeof data !== 'object') {
    context.logger.failed(trace, startedAt, 'gameId and data required');
    context.responder.error(ws, 'gameId and data required', requestId);
    return;
  }

  if (idempotencyKey && !await context.idempotencyStore.reserve(idempotencyKey)) {
    context.logger.duplicatePending(trace, startedAt);
    context.responder.pending(ws, requestId);
    return;
  }

  try {
    await context.gamePlayerDataStore.save({
      userId: ws.userId,
      gameId,
      data
    });

    const response = {
      status: 'ok',
      action: 'persistent_data',
      requestId,
      gameId
    };

    await remember(ws, idempotencyKey, response, context.idempotencyStore);
    context.responder.ok(ws, {
      action: 'persistent_data',
      requestId,
      gameId
    });
    context.logger.completed({ ...trace, gameId }, startedAt);
  } catch (err) {
    if (idempotencyKey) {
      await context.idempotencyStore.release(idempotencyKey);
    }

    const appErr = err instanceof AppError ? err : new AppError((err as Error).message);
    context.logger.failed(trace, startedAt, appErr.message, {
      status: appErr.status,
      source: appErr.source,
      detail: appErr.detail
    });
    context.responder.error(ws, appErr.message, requestId, appErr.detail);
  }
}
