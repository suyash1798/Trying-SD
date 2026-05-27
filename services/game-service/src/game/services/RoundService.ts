import AppError from '../../errors/AppError';
import CurrentRoundRepository from '../../repositories/CurrentRoundRepository';
import RoundRepository from '../../repositories/RoundRepository';

export interface EndRoundResponse {
  status: 'ok';
  action: 'end_round';
  requestId: string;
  roundId: string;
  spinCount: number;
}

class RoundService {
  constructor(
    private readonly currentRoundRepository: CurrentRoundRepository,
    private readonly roundRepository: RoundRepository
  ) {}

  async endRound({
    userId,
    roomId,
    requestId
  }: {
    userId: string;
    roomId: string;
    requestId: string;
  }): Promise<EndRoundResponse> {
    const round = await this.currentRoundRepository.complete(userId, roomId);

    if (!round) {
      throw new AppError('active round not found', 404);
    }

    await this.roundRepository.complete(round);

    return {
      status: 'ok',
      action: 'end_round',
      requestId,
      roundId: round.roundId,
      spinCount: round.spinCount
    };
  }
}

export default RoundService;
