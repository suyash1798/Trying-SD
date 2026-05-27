import { randomUUID } from 'crypto';
import RedisKeyValueClient from '../infra/RedisKeyValueClient';
import { ActiveRound } from './models/Round';

class CurrentRoundStore {
  constructor(private readonly redis: RedisKeyValueClient) {}

  async get(userId: string, roomId: string): Promise<ActiveRound | null> {
    const value = await this.redis.get(this.key(userId, roomId));
    return value ? JSON.parse(value) as ActiveRound : null;
  }

  async getOrCreate(userId: string, roomId: string): Promise<ActiveRound> {
    const existing = await this.get(userId, roomId);

    if (existing) {
      return existing;
    }

    const round: ActiveRound = {
      roundId: randomUUID(),
      userId,
      roomId,
      status: 'ACTIVE',
      spinCount: 0
    };

    await this.save(round);
    return round;
  }

  async incrementSpin(round: ActiveRound): Promise<ActiveRound> {
    const updated = { ...round, spinCount: round.spinCount + 1 };
    await this.save(updated);
    return updated;
  }

  async complete(userId: string, roomId: string): Promise<ActiveRound | null> {
    const round = await this.get(userId, roomId);

    if (!round) {
      return null;
    }

    await this.redis.del(this.key(userId, roomId));
    return round;
  }

  private async save(round: ActiveRound): Promise<void> {
    await this.redis.set(this.key(round.userId, round.roomId), JSON.stringify(round));
  }

  private key(userId: string, roomId: string): string {
    return `current-round:${userId}:${roomId}`;
  }
}

export default CurrentRoundStore;
