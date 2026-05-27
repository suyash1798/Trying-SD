import CurrentRoundRepository from '../../repositories/CurrentRoundRepository';
import RoundRepository from '../../repositories/RoundRepository';
import SpinRepository from '../../repositories/SpinRepository';
import { WalletAdjustHandler } from '../actions/types';

const symbols = ['CHERRY', 'LEMON', 'BELL', 'SEVEN'];

interface SpinRequest {
  userId: string;
  roomId: string;
  requestId: string;
  spinId: string;
  betAmount: number;
}

export interface SpinResponse {
  status: 'ok';
  action: 'spin';
  requestId: string;
  roundId: string;
  spinId: string;
  betAmount: number;
  symbols: string[];
  winAmount: number;
  balance: number;
}

class SpinService {
  constructor(
    private readonly adjustWallet: WalletAdjustHandler,
    private readonly currentRoundRepository: CurrentRoundRepository,
    private readonly roundRepository: RoundRepository,
    private readonly spinRepository: SpinRepository
  ) {}

  async spin(request: SpinRequest): Promise<SpinResponse> {
    const round = await this.currentRoundRepository.getOrCreate(request.userId, request.roomId);
    await this.roundRepository.saveStarted(round);

    const debit = await this.adjustWallet(request.userId, -request.betAmount);
    const result = this.roll(request.betAmount);
    let balance = debit.balance;

    if (result.winAmount > 0) {
      const credit = await this.adjustWallet(request.userId, result.winAmount);
      balance = credit.balance;
    }

    const response: SpinResponse = {
      status: 'ok',
      action: 'spin',
      requestId: request.requestId,
      roundId: round.roundId,
      spinId: request.spinId,
      betAmount: request.betAmount,
      symbols: result.symbols,
      winAmount: result.winAmount,
      balance
    };

    await this.spinRepository.saveCompletedSpin({
      userId: request.userId,
      roomId: request.roomId,
      roundId: round.roundId,
      requestId: request.requestId,
      spinId: request.spinId,
      betAmount: request.betAmount,
      winAmount: result.winAmount,
      symbols: result.symbols,
      balance
    });
    await this.currentRoundRepository.incrementSpin(round);

    return response;
  }

  private roll(betAmount: number): { symbols: string[]; winAmount: number } {
    const result = [this.randomSymbol(), this.randomSymbol(), this.randomSymbol()];

    return {
      symbols: result,
      winAmount: this.calculateWin(result, betAmount)
    };
  }

  private randomSymbol(): string {
    return symbols[Math.floor(Math.random() * symbols.length)];
  }

  private calculateWin(result: string[], betAmount: number): number {
    const uniqueSymbols = new Set(result).size;

    if (uniqueSymbols === 1) {
      return betAmount * 5;
    }

    if (uniqueSymbols === 2) {
      return betAmount * 2;
    }

    return 0;
  }
}

export default SpinService;
