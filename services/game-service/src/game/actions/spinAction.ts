import AppError from '../../errors/AppError';
import { GameSocket, SpinPayload } from '../../types/websocket';
import { SpinResponse } from '../services/SpinService';
import { GameActionHandler } from './GameActionHandler';
import { ActionContext, RequestTrace } from './types';

class SpinAction implements GameActionHandler<SpinPayload> {
  constructor(private readonly context: ActionContext) {}

  async handle(ws: GameSocket, payload: SpinPayload): Promise<SpinResponse> {
    const { requestId, gameId, spinId, betAmount } = payload;

    if (!ws.userId || !ws.roomId) {
      throw new AppError('join required', 400);
    }

    return this.context.spinService.spin({
      userId: ws.userId,
      roomId: ws.roomId,
      requestId,
      gameId,
      spinId,
      betAmount
    });
  }

  successTrace(payload: SpinPayload): Record<string, unknown> {
    return {
      spinId: payload.spinId,
      betAmount: payload.betAmount
    };
  }

  async afterSuccess(ws: GameSocket, _payload: SpinPayload, response: object, trace: RequestTrace): Promise<void> {
    const spin = response as SpinResponse;

    try {
      await this.context.publisher.spinCompleted(ws, {
        roundId: spin.roundId,
        spinId: spin.spinId,
        betAmount: spin.betAmount,
        winAmount: spin.winAmount,
        symbols: spin.symbols,
        balance: spin.balance,
        requestId: spin.requestId
      });
    } catch (err) {
      this.context.logger.redisPublishFailed(trace, err as Error);
    }
  }
}

export default SpinAction;
