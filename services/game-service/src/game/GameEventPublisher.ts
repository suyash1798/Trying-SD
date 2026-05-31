import RedisPubSub from '../infra/redisPubSub';
import { GameSocket } from '../types/websocket';

interface PlayerJoinedInput {
  requestId?: string | null;
}

interface SpinCompletedInput {
  roundId: string;
  spinId: string;
  betAmount: number;
  winAmount: number;
  symbols: string[];
  balance: number;
  requestId: string;
}

class GameEventPublisher {
  constructor(
    private readonly pubSub: RedisPubSub,
    private readonly serverId: string
  ) {}

  async playerJoined(
    ws: GameSocket,
    data: PlayerJoinedInput
  ): Promise<void> {
    const { requestId } = data;
    const userId = ws.userId!;
    const roomId = ws.roomId!;

    await this.pubSub.publish({
      type: 'player_joined',
      userId,
      roomId,
      requestId,
      sourceConnectionId: ws.id,
      serverId: this.serverId,
      timestamp: new Date().toISOString(),
    });
  }

  async spinCompleted(ws: GameSocket, data: SpinCompletedInput): Promise<void> {
    const { roundId, spinId, betAmount, winAmount, symbols, balance, requestId } = data;
    const userId = ws.userId!;
    const roomId = ws.roomId!;

    await this.pubSub.publish({
      type: 'player_action',
      action: 'spin',
      userId,
      roomId,
      roundId,
      spinId,
      betAmount,
      winAmount,
      symbols,
      balance,
      requestId,
      sourceConnectionId: ws.id,
      serverId: this.serverId,
      timestamp: new Date().toISOString(),
    });
  }
}

export default GameEventPublisher;
