import { PrismaClient } from '@prisma/client';
import { ActiveRound } from './models/Round';

class RoundStore {
  constructor(private readonly prisma: PrismaClient) {}

  async saveStarted(round: ActiveRound): Promise<void> {
    await this.prisma.gameRound.upsert({
      where: { roundId: round.roundId },
      update: {},
      create: {
        roundId: round.roundId,
        userId: round.userId,
        roomId: round.roomId,
        status: 'ACTIVE'
      }
    });
  }

  async complete(round: ActiveRound): Promise<void> {
    await this.prisma.gameRound.update({
      where: { roundId: round.roundId },
      data: {
        status: 'DONE',
        completedAt: new Date()
      }
    });
  }
}

export default RoundStore;
