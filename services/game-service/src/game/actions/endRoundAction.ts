import AppError from '../../errors/AppError';
import { EndRoundPayload, GameSocket } from '../../types/websocket';
import { EndRoundResponse } from '../services/RoundService';
import { GameActionHandler } from './GameActionHandler';
import { ActionContext } from './types';

class EndRoundAction implements GameActionHandler<EndRoundPayload> {
  constructor(private readonly context: ActionContext) {}

  async handle(ws: GameSocket, payload: EndRoundPayload): Promise<EndRoundResponse> {
    const { requestId } = payload;

    if (!ws.userId || !ws.roomId) {
      throw new AppError('join required', 400);
    }

    return this.context.roundService.endRound({
      userId: ws.userId,
      roomId: ws.roomId,
      requestId,
    });
  }

  successTrace(_payload: EndRoundPayload, response: object): Record<string, unknown> {
    const endRound = response as EndRoundResponse;

    return {
      roundId: endRound.roundId,
      spinCount: endRound.spinCount
    };
  }
}

export default EndRoundAction;
