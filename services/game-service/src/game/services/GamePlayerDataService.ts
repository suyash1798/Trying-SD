import GamePlayerDataRepository from '../../repositories/GamePlayerDataRepository';

export interface PersistentDataResponse {
  status: 'ok';
  action: 'persistent_data';
  requestId: string;
  gameId: string;
}

interface SavePersistentDataRequest {
  userId: string;
  requestId: string;
  gameId: string;
  data: Record<string, unknown>;
}

class GamePlayerDataService {
  constructor(private readonly repository: GamePlayerDataRepository) {}

  async save(request: SavePersistentDataRequest): Promise<PersistentDataResponse> {
    const { userId, requestId, gameId, data } = request;

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
