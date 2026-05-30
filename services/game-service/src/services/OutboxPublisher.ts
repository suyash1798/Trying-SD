import KafkaEventProducer from '../infra/KafkaEventProducer';
import OutboxRepository from '../repositories/OutboxRepository';

class OutboxPublisher {
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(
    private readonly outboxRepository: OutboxRepository,
    private readonly kafkaProducer: KafkaEventProducer,
    private readonly intervalMs = 2000,
    private readonly batchSize = 50
  ) {}

  start(): void {
    if (this.timer) {
      return;
    }

    this.timer = setInterval(() => {
      this.publishPending().catch((err) => {
        console.error('outbox publish failed', (err as Error).message);
      });
    }, this.intervalMs);
  }

  stop(): void {
    if (!this.timer) {
      return;
    }

    clearInterval(this.timer);
    this.timer = null;
  }

  private async publishPending(): Promise<void> {
    if (this.running) {
      return;
    }

    this.running = true;

    try {
      const events = await this.outboxRepository.claimPending(this.batchSize);

      for (const event of events) {
        const published = await this.kafkaProducer.publish(event.eventType, event.payload);

        if (published) {
          await this.outboxRepository.markPublished(event.id);
        } else {
          await this.outboxRepository.markPending(event.id);
        }
      }
    } finally {
      this.running = false;
    }
  }
}

export default OutboxPublisher;
