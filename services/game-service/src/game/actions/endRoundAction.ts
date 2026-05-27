import AppError from '../../errors/AppError';
import { EndRoundPayload, GameSocket } from '../../types/websocket';
import { ActionContext, remember, RequestTrace } from './types';

export async function endRoundAction(
  ws: GameSocket,
  payload: EndRoundPayload,
  context: ActionContext,
  trace: RequestTrace,
  startedAt: number,
  idempotencyKey: string | null
): Promise<void> {
  const { requestId } = payload;

  if (!ws.userId || !ws.roomId) {
    context.logger.failed(trace, startedAt, 'join required');
    context.responder.error(ws, 'join required', requestId);
    return;
  }

  if (idempotencyKey && !await context.idempotencyRepository.reserve(idempotencyKey)) {
    context.logger.duplicatePending(trace, startedAt);
    context.responder.pending(ws, requestId);
    return;
  }

  try {
    const response = await context.roundService.endRound({
      userId: ws.userId,
      roomId: ws.roomId,
      requestId,
    });

    await remember(ws, idempotencyKey, response, context.idempotencyRepository);
    context.responder.ok(ws, response);
    context.logger.completed({ ...trace, roundId: response.roundId, spinCount: response.spinCount }, startedAt);
  } catch (err) {
    if (idempotencyKey) {
      await context.idempotencyRepository.release(idempotencyKey);
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
