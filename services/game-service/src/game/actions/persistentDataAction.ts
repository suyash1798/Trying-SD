import AppError from '../../errors/AppError';
import { GameSocket, PersistentDataPayload } from '../../types/websocket';
import { PersistentDataResponse } from '../services/GamePlayerDataService';
import { GameActionHandler } from './GameActionHandler';
import { ActionContext, RequestTrace } from './types';

class PersistentDataAction implements GameActionHandler<PersistentDataPayload> {
  constructor(private readonly context: ActionContext) {}

  async handle(ws: GameSocket, payload: PersistentDataPayload): Promise<PersistentDataResponse> {
    const { requestId, gameId, data } = payload;

    if (!ws.userId || !ws.roomId) {
      throw new AppError('join required', 400);
    }

    return this.context.gamePlayerDataService.save({
      userId: ws.userId,
      requestId,
      gameId,
      data
    });
  }

  successTrace(payload: PersistentDataPayload): Record<string, unknown> {
    return {
      gameId: payload.gameId
    };
  }

  async afterSuccess(
    ws: GameSocket,
    payload: PersistentDataPayload,
    _response: object,
    _trace: RequestTrace
  ): Promise<void> {
    if (!ws.userId || !ws.roomId) {
      return;
    }

    await this.context.roundService.recordActionIfActive(ws.userId, ws.roomId, {
      action: 'persistent_data',
      requestId: payload.requestId,
      payload: { gameId: payload.gameId, data: payload.data },
      result: { status: 'ok' }
    });
  }
}

export default PersistentDataAction;
