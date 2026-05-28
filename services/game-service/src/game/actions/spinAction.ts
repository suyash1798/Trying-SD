import AppError from '../../errors/AppError';
import { GameSocket, SpinPayload } from '../../types/websocket';
import { ActionContext, remember, RequestTrace } from './types';

export async function spinAction(
  ws: GameSocket,
  payload: SpinPayload,
  context: ActionContext,
  trace: RequestTrace,
  startedAt: number,
  idempotencyKey: string | null
): Promise<void> {
  const { requestId, gameId, spinId, betAmount } = payload;

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

  ws.pendingRequests.add(idempotencyKey || requestId);

  try {
    const response = await context.spinService.spin({
      userId: ws.userId,
      roomId: ws.roomId,
      requestId,
      gameId,
      spinId,
      betAmount
    });

    await remember(ws, idempotencyKey, response, context.idempotencyRepository);
    context.responder.ok(ws, response);
    context.logger.completed({ ...trace, spinId, betAmount }, startedAt);

    context.publisher.spinCompleted(ws, {
      roundId: response.roundId,
      spinId: response.spinId,
      betAmount: response.betAmount,
      winAmount: response.winAmount,
      symbols: response.symbols,
      balance: response.balance,
      requestId: response.requestId
    }).catch((publishErr) => {
      console.error('spin notification publish failed', (publishErr as Error).message);
    });
  } catch (err) {
    if (idempotencyKey) {
      await context.idempotencyRepository.release(idempotencyKey);
    }

    const appErr = new AppError((err as Error).message);
    context.logger.failed(trace, startedAt, appErr.message, {
      status: appErr.status,
      source: appErr.source,
      detail: appErr.detail
    });
    context.responder.error(ws, appErr.message, requestId, appErr.detail);
  } finally {
    ws.pendingRequests.delete(idempotencyKey || requestId);
  }
}
