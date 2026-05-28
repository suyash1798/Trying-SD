import { PrismaClient } from '@prisma/client';
import { CompletedSpin } from '../game/models/Spin';

class SpinRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findCompletedByUserRoundAndSpinId(
    userId: string,
    roundId: string,
    spinId: string
  ): Promise<CompletedSpin | null> {
    const spin = await this.prisma.gameSpin.findUnique({
      where: {
        userId_roundId_spinId: {
          userId,
          roundId,
          spinId
        }
      }
    });

    if (!spin) {
      return null;
    }

    return {
      userId: spin.userId,
      roomId: spin.roomId,
      roundId: spin.roundId,
      gameId: spin.gameId,
      requestId: spin.requestId,
      spinId: spin.spinId,
      betAmount: spin.betAmount,
      winAmount: spin.winAmount,
      symbols: spin.symbols as string[],
      balance: spin.balance
    };
  }

  async saveCompletedSpin(spin: CompletedSpin): Promise<void> {
    await this.prisma.gameSpin.createMany({
      data: {
        userId: spin.userId,
        roomId: spin.roomId,
        roundId: spin.roundId,
        gameId: spin.gameId,
        requestId: spin.requestId,
        spinId: spin.spinId,
        betAmount: spin.betAmount,
        winAmount: spin.winAmount,
        symbols: spin.symbols,
        balance: spin.balance
      },
      skipDuplicates: true
    });
  }
}

export default SpinRepository;
