import config from '../config';
import DynamoDbClient from '../infra/DynamoDbClient';
import GamePlayerDataRepository from '../repositories/GamePlayerDataRepository';

class PersistentDataSeeder {
  constructor(private readonly repository: GamePlayerDataRepository) {}

  async run(): Promise<void> {
    await this.repository.ensureTable();

    await this.repository.save({
      userId: '100001',
      gameId: 'slot-1',
      data: {
        freeSpinsLeft: 3,
        bonusMultiplier: 2,
        lastFeature: 'free-spins',
        totalSpins: 12
      }
    });

    await this.repository.save({
      userId: '100002',
      gameId: 'slot-1',
      data: {
        freeSpinsLeft: 0,
        bonusMultiplier: 1,
        lastFeature: null,
        totalSpins: 5
      }
    });

    await this.repository.save({
      userId: '100001',
      gameId: 'slot-2',
      data: {
        freeSpinsLeft: 8,
        bonusMultiplier: 3,
        lastFeature: 'bonus-round',
        totalSpins: 31
      }
    });

    console.log('Seeded persistent game-player data');
  }
}

const dynamoDb = new DynamoDbClient({
  region: config.awsRegion,
  endpoint: config.dynamoDbEndpoint
});

const repository = new GamePlayerDataRepository(
  dynamoDb,
  config.gamePlayerDataTable
);

const seeder = new PersistentDataSeeder(repository);

seeder.run()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => {
    dynamoDb.close();
  });
