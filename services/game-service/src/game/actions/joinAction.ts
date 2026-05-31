import AppError from '../../errors/AppError';
import { GameSocket, JoinPayload } from '../../types/websocket';
import { GameActionHandler } from './GameActionHandler';
import { ActionContext, RequestTrace } from './types';

class JoinAction implements GameActionHandler<JoinPayload> {
  constructor(private readonly context: ActionContext) {}

  async handle(ws: GameSocket, payload: JoinPayload): Promise<object> {
    const { userId, roomId, requestId } = payload;

    if (!userId) {
      throw new AppError('invalid token', 401);
    }

    if (!await this.context.roomMembershipRepository.exists(userId, roomId)) {
      throw new AppError('room membership required', 403);
    }

    ws.userId = userId;
    ws.roomId = roomId;

    const roundHistory = await this.context.roundService.history(userId, roomId);
    return { status: 'ok', action: 'joined', userId, roomId, requestId, roundHistory };
  }

  async onSuccess(ws: GameSocket, payload: JoinPayload, _response: object, trace: RequestTrace): Promise<void> {
    const { requestId } = payload;

    try {
      await this.context.publisher.playerJoined(ws, { requestId });
    } catch (err) {
      this.context.logger.redisPublishFailed(trace, err as Error);
    }
  }
}

export default JoinAction;
