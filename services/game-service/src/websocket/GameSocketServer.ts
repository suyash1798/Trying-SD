import { randomUUID } from 'crypto';
import { Server as HttpServer } from 'http';
import { RawData, WebSocketServer } from 'ws';
import GameActions, { WalletAdjustHandler } from '../game/GameActions';
import CurrentRoundStore from '../game/CurrentRoundStore';
import GamePlayerDataStore from '../game/GamePlayerDataStore';
import IdempotencyStore from '../game/IdempotencyStore';
import RoundStore from '../game/RoundStore';
import SpinStore from '../game/SpinStore';
import RedisPubSub from '../infra/redisPubSub';
import { log } from '../observability/logger';
import { PlayerEvent } from '../types/events';
import { GameSocket, IncomingMessagePayload } from '../types/websocket';
import Heartbeat from './Heartbeat';
import RoomRegistry from './RoomRegistry';

class GameSocketServer {
  private readonly wss: WebSocketServer;
  private readonly heartbeat: Heartbeat;
  private readonly actions: GameActions;
  private readonly pubSub: RedisPubSub;
  private readonly rooms = new RoomRegistry();

  constructor({
    server,
    heartbeatIntervalMs,
    adjustWallet,
    pubSub,
    gamePlayerDataStore,
    currentRoundStore,
    idempotencyStore,
    roundStore,
    spinStore,
    serverId
  }: {
    server: HttpServer;
    heartbeatIntervalMs: number;
    adjustWallet: WalletAdjustHandler;
    pubSub: RedisPubSub;
    gamePlayerDataStore: GamePlayerDataStore;
    currentRoundStore: CurrentRoundStore;
    idempotencyStore: IdempotencyStore;
    roundStore: RoundStore;
    spinStore: SpinStore;
    serverId: string;
  }) {
    this.wss = new WebSocketServer({ server });
    this.heartbeat = new Heartbeat(this.wss, heartbeatIntervalMs);
    this.pubSub = pubSub;
    this.actions = new GameActions(
      adjustWallet,
      pubSub,
      serverId,
      gamePlayerDataStore,
      currentRoundStore,
      idempotencyStore,
      roundStore,
      spinStore
    );
  }

  start(): void {
    this.pubSub.onMessage((event) => this.notifyRoom(event));

    this.wss.on('connection', (ws) => this.handleConnection(ws as GameSocket));
    this.wss.on('close', () => this.stop());
    this.heartbeat.start();
  }

  private handleConnection(ws: GameSocket): void {
    ws.id = randomUUID();
    ws.isAlive = true;
    ws.roomId = null;
    ws.userId = null;
    ws.processedRequests = new Map();
    ws.pendingRequests = new Set();
    log('ws_connected', { connectionId: ws.id });

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (msg) => this.handleMessage(ws, msg));
    ws.on('close', () => {
      this.rooms.remove(ws);
      log('ws_closed', { connectionId: ws.id, userId: ws.userId, roomId: ws.roomId });
    });
  }

  private async handleMessage(ws: GameSocket, msg: RawData): Promise<void> {
    let payload: IncomingMessagePayload;

    try {
      payload = JSON.parse(msg.toString());
    } catch (err) {
      log('ws_invalid_json', { connectionId: ws.id });
      ws.send(JSON.stringify({ status: 'error', error: 'invalid json' }));
      return;
    }

    await this.actions.handle(ws, payload);
    this.rooms.sync(ws);
  }

  private notifyRoom(event: PlayerEvent): void {
    this.rooms.notify(event);
  }

  stop(): void {
    this.heartbeat.stop();
  }
}

export default GameSocketServer;
