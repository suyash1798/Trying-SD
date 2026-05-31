import { GameSocket, IncomingMessagePayload } from '../../types/websocket';
import { RequestTrace } from './types';

export interface GameActionHandler<TPayload extends IncomingMessagePayload = IncomingMessagePayload> {
  handle(ws: GameSocket, payload: TPayload): Promise<object>;
  successTrace?(payload: TPayload, response: object): Record<string, unknown>;
  afterSuccess?(
    ws: GameSocket,
    payload: TPayload,
    response: object,
    trace: RequestTrace
  ): Promise<void>;
}
