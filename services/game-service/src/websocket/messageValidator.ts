import { z } from 'zod';
import { IncomingMessagePayload } from '../types/websocket';

const joinSchema = z.object({
  action: z.literal('join'),
  requestId: z.string().min(1),
  roomId: z.string().min(1),
  token: z.string().min(1)
});

const spinSchema = z.object({
  action: z.literal('spin'),
  requestId: z.string().min(1),
  gameId: z.string().min(1),
  spinId: z.string().min(1),
  betAmount: z.number().positive()
});

const endRoundSchema = z.object({
  action: z.literal('end_round'),
  requestId: z.string().min(1)
});

const persistentDataSchema = z.object({
  action: z.literal('persistent_data'),
  requestId: z.string().min(1),
  gameId: z.string().min(1),
  data: z.record(z.string(), z.unknown())
});

const messageSchema = z.discriminatedUnion('action', [
  joinSchema,
  spinSchema,
  endRoundSchema,
  persistentDataSchema
]);

export function validateMessage(payload: unknown): IncomingMessagePayload {
  return messageSchema.parse(payload);
}
