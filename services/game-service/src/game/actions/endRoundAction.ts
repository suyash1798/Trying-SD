import AppError from '../../errors/AppError';
import { IncomingMessagePayload, GameSocket } from '../../types/websocket';
import { ActionContext, remember, RequestTrace } from './types';

export async function endRoundAction(
  ws: GameSocket,
  payload: IncomingMessagePayload,
  context: ActionContext,
  trace: RequestTrace,
  startedAt: number,
  idempotencyKey: string | null
): Promise<void> {
  const { requestId } = payload;

  if (!requestId) {
    context.logger.failed(trace, startedAt, 'requestId required');
    context.responder.error(ws, 'requestId required');
    return;
  }

  if (!ws.userId || !ws.roomId) {
    context.logger.failed(trace, startedAt, 'join required');
    context.responder.error(ws, 'join required', requestId);
    return;
  }

  if (idempotencyKey && !await context.idempotencyStore.reserve(idempotencyKey)) {
    context.logger.duplicatePending(trace, startedAt);
    context.responder.pending(ws, requestId);
    return;
  }

  try {
    const round = await context.currentRoundStore.complete(ws.userId, ws.roomId);

    if (!round) {
      throw new AppError('active round not found', 404);
    }

    await context.roundStore.complete(round);

    const response = {
      status: 'ok',
      action: 'end_round',
      requestId,
      roundId: round.roundId,
      spinCount: round.spinCount
    };

    await remember(ws, idempotencyKey, response, context.idempotencyStore);
    context.responder.ok(ws, {
      action: 'end_round',
      requestId,
      roundId: round.roundId,
      spinCount: round.spinCount
    });
    context.logger.completed({ ...trace, roundId: round.roundId, spinCount: round.spinCount }, startedAt);
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
