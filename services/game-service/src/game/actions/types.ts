import RequestLogger from '../../observability/RequestLogger';
import GameEventPublisher from '../GameEventPublisher';
import GamePlayerDataStore from '../GamePlayerDataStore';
import GameResponseSender from '../GameResponseSender';
import CurrentRoundStore from '../CurrentRoundStore';
import IdempotencyStore from '../IdempotencyStore';
import RoundStore from '../RoundStore';
import SpinStore from '../SpinStore';
import { WalletAdjustResponse } from '../../types/wallet';
import { GameSocket } from '../../types/websocket';

export type WalletAdjustHandler = (userId: string, amount: number) => Promise<WalletAdjustResponse>;

export type RequestTrace = Record<string, unknown> & {
  action: string;
  requestId?: string | null;
  connectionId: string;
  userId?: string | null;
  roomId?: string | null;
};

export interface ActionContext {
  adjustWallet: WalletAdjustHandler;
  gamePlayerDataStore: GamePlayerDataStore;
  publisher: GameEventPublisher;
  currentRoundStore: CurrentRoundStore;
  idempotencyStore: IdempotencyStore;
  roundStore: RoundStore;
  spinStore: SpinStore;
  logger: RequestLogger;
  responder: GameResponseSender;
}

export async function remember(
  ws: GameSocket,
  key: string | null,
  response: object,
  store: IdempotencyStore
): Promise<void> {
  if (key) {
    ws.processedRequests.set(key, response);
    await store.complete(key, response);
  }
}
