import { Kafka, Producer } from 'kafkajs';

class KafkaEventProducer {
  private readonly producer: Producer | null;
  private connected = false;

  constructor(
    brokers: string[],
    private readonly topic: string,
    clientId: string
  ) {
    this.producer = brokers.length ? new Kafka({ clientId, brokers }).producer() : null;
  }

  async connect(): Promise<void> {
    if (!this.producer || this.connected) {
      return;
    }

    try {
      await this.producer.connect();
      this.connected = true;
    } catch (err) {
      console.error('kafka connect failed', (err as Error).message);
    }
  }

  async publish(type: string, payload: object): Promise<void> {
    if (!this.producer) {
      return;
    }

    if (!this.connected) {
      await this.connect();
    }

    if (!this.connected) {
      return;
    }

    try {
      await this.producer.send({
        topic: this.topic,
        messages: [
          {
            key: type,
            value: JSON.stringify({
              type,
              timestamp: new Date().toISOString(),
              payload
            })
          }
        ]
      });
    } catch (err) {
      console.error('kafka publish failed', (err as Error).message);
    }
  }

  async close(): Promise<void> {
    if (!this.producer || !this.connected) {
      return;
    }

    await this.producer.disconnect();
    this.connected = false;
  }
}

export default KafkaEventProducer;
