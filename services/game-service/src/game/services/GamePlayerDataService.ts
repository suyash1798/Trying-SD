import GamePlayerDataRepository from '../../repositories/GamePlayerDataRepository';

export interface PersistentDataResponse {
  status: 'ok';
  action: 'persistent_data';
  requestId: string;
  gameId: string;
}

class GamePlayerDataService {
  constructor(private readonly repository: GamePlayerDataRepository) {}

  async save({
    userId,
    requestId,
    gameId,
    data
  }: {
    userId: string;
    requestId: string;
    gameId: string;
    data: Record<string, unknown>;
  }): Promise<PersistentDataResponse> {
    await this.repository.save({ userId, gameId, data });

    return {
      status: 'ok',
      action: 'persistent_data',
      requestId,
      gameId
    };
  }
}

export default GamePlayerDataService;
