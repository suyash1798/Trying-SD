import { randomUUID } from 'crypto';
import { Server as HttpServer } from 'http';
import { RawData, WebSocketServer } from 'ws';
import GameActions, { WalletAdjustHandler } from '../game/GameActions';
import CurrentRoundRepository from '../repositories/CurrentRoundRepository';
import GamePlayerDataRepository from '../repositories/GamePlayerDataRepository';
import IdempotencyRepository from '../repositories/IdempotencyRepository';
import RoundRepository from '../repositories/RoundRepository';
import SpinRepository from '../repositories/SpinRepository';
import RedisPubSub from '../infra/redisPubSub';
import { log } from '../observability/logger';
import { PlayerEvent } from '../types/events';
import { GameSocket, IncomingMessagePayload } from '../types/websocket';
import Heartbeat from './Heartbeat';
import { validateMessage } from './messageValidator';
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
    gamePlayerDataRepository,
    currentRoundRepository,
    idempotencyRepository,
    roundRepository,
    spinRepository,
    serverId
  }: {
    server: HttpServer;
    heartbeatIntervalMs: number;
    adjustWallet: WalletAdjustHandler;
    pubSub: RedisPubSub;
    gamePlayerDataRepository: GamePlayerDataRepository;
    currentRoundRepository: CurrentRoundRepository;
    idempotencyRepository: IdempotencyRepository;
    roundRepository: RoundRepository;
    spinRepository: SpinRepository;
    serverId: string;
  }) {
    this.wss = new WebSocketServer({ server });
    this.heartbeat = new Heartbeat(this.wss, heartbeatIntervalMs);
    this.pubSub = pubSub;
    this.actions = new GameActions(
      adjustWallet,
      pubSub,
      serverId,
      gamePlayerDataRepository,
      currentRoundRepository,
      idempotencyRepository,
      roundRepository,
      spinRepository
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
      payload = validateMessage(JSON.parse(msg.toString()));
    } catch (err) {
      log('ws_invalid_message', { connectionId: ws.id });
      ws.send(JSON.stringify({ status: 'error', error: 'invalid message' }));
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
