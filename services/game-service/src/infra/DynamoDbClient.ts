import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

class DynamoDbClient {
  readonly document: DynamoDBDocumentClient;

  constructor({
    region,
    endpoint
  }: {
    region: string;
    endpoint?: string;
  }) {
    const client = new DynamoDBClient({
      region,
      endpoint,
      credentials: endpoint
        ? {
            accessKeyId: 'local',
            secretAccessKey: 'local'
          }
        : undefined
    });

    this.document = DynamoDBDocumentClient.from(client);
  }
}

export default DynamoDbClient;
