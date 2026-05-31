import { PrismaClient } from '@prisma/client';

const userId = '100001';
const roomId = 'seed-room-1';
const gameId = 'slot-1';
const activeRoundId = 'seed-active-round-1';
const completedRoundId = 'seed-completed-round-1';

interface SeedRoundAction {
  roundId: string;
  action: string;
  requestId: string;
  payload: Record<string, unknown>;
  result: Record<string, unknown>;
}

class GameServiceSeeder {
  constructor(private readonly prisma: PrismaClient) {}

  async run(): Promise<void> {
    await this.seedRounds();
    await this.seedSpins();
    await this.seedRoundActions();

    console.log('Seeded game-service demo data');
  }

  private async seedRounds(): Promise<void> {
    await this.prisma.gameRound.upsert({
      where: { roundId: activeRoundId },
      update: {
        status: 'ACTIVE',
        completedAt: null
      },
      create: {
        roundId: activeRoundId,
        userId,
        roomId,
        status: 'ACTIVE'
      }
    });

    await this.prisma.gameRound.upsert({
      where: { roundId: completedRoundId },
      update: {
        status: 'DONE',
        completedAt: new Date()
      },
      create: {
        roundId: completedRoundId,
        userId,
        roomId,
        status: 'DONE',
        completedAt: new Date()
      }
    });
  }

  private async seedSpins(): Promise<void> {
    await this.prisma.gameSpin.createMany({
      data: [
        {
          userId,
          roomId,
          roundId: activeRoundId,
          gameId,
          requestId: 'seed-active-spin-1',
          spinId: '1',
          betAmount: 10,
          winAmount: 20,
          symbols: ['CHERRY', 'CHERRY', 'LEMON'],
          balance: 100010
        },
        {
          userId,
          roomId,
          roundId: completedRoundId,
          gameId,
          requestId: 'seed-completed-spin-1',
          spinId: '1',
          betAmount: 10,
          winAmount: 0,
          symbols: ['CHERRY', 'LEMON', 'BELL'],
          balance: 99990
        },
        {
          userId,
          roomId,
          roundId: completedRoundId,
          gameId,
          requestId: 'seed-completed-spin-2',
          spinId: '2',
          betAmount: 10,
          winAmount: 50,
          symbols: ['SEVEN', 'SEVEN', 'SEVEN'],
          balance: 100040
        }
      ],
      skipDuplicates: true
    });
  }

  private async seedRoundActions(): Promise<void> {
    await this.saveRoundAction({
      roundId: activeRoundId,
      action: 'spin',
      requestId: 'seed-active-spin-1',
      payload: {
        gameId,
        spinId: '1',
        betAmount: 10
      },
      result: {
        roundId: activeRoundId,
        symbols: ['CHERRY', 'CHERRY', 'LEMON'],
        winAmount: 20,
        balance: 100010
      }
    });

    await this.saveRoundAction({
      roundId: activeRoundId,
      action: 'persistent_data',
      requestId: 'seed-data-1',
      payload: {
        gameId,
        data: {
          freeSpinsLeft: 3,
          bonusMultiplier: 2
        }
      },
      result: {
        saved: true
      }
    });
  }

  private async saveRoundAction(seedAction: SeedRoundAction): Promise<void> {
    const { roundId, action, requestId, payload, result } = seedAction;

    await this.prisma.$executeRaw`
      insert into round_actions (
        round_id,
        user_id,
        room_id,
        action,
        request_id,
        payload,
        result
      )
      values (
        ${roundId},
        ${userId},
        ${roomId},
        ${action},
        ${requestId},
        ${JSON.stringify(payload)}::jsonb,
        ${JSON.stringify(result)}::jsonb
      )
      on conflict (round_id, action, request_id) do nothing
    `;
  }
}

const prisma = new PrismaClient();

const seeder = new GameServiceSeeder(prisma);

seeder.run()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
