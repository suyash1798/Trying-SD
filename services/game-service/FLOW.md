# Game Service Flow

This is the core flow of `game-service`.

## Main Flow

```mermaid
flowchart TD
  Client["Client"]
  WS["GameSocketServer"]
  Executor["ActionExecutor"]
  Action["Action Handler"]
  Redis["Redis"]
  Wallet["wallet-service"]
  DB["Postgres"]
  Dynamo["DynamoDB"]
  Room["RoomRegistry"]

  Client -->|"WebSocket message"| WS
  WS -->|"validate message"| Executor
  Executor -->|"check idempotency"| Redis
  Executor -->|"run action"| Action

  Action -->|"spin: deduct/credit"| Wallet
  Action -->|"rounds/spins/history"| DB
  Action -->|"persistent_data"| Dynamo

  Executor -->|"send response"| Client
  Action -->|"publish room event"| Redis
  Redis -->|"incoming event"| WS
  WS --> Room
  Room -->|"notify same room sockets"| Client
```

## Join

```mermaid
sequenceDiagram
  participant Client
  participant WS as GameSocketServer
  participant Action as JoinAction
  participant DB as Postgres
  participant Redis

  Client->>WS: join { requestId, roomId, token }
  WS->>Action: handle join
  Action->>Action: verify token and get userId
  Action->>DB: check room membership
  Action->>Redis: load active round if present
  Action-->>Client: joined { userId, roomId, roundHistory }
  Action->>Redis: publish player_joined
```

After join succeeds:

- `ws.userId` is set.
- `ws.roomId` is set.
- The socket is mapped into `RoomRegistry`.

## Spin

```mermaid
sequenceDiagram
  participant Client
  participant Executor as ActionExecutor
  participant Redis
  participant Spin as SpinAction
  participant Wallet as wallet-service
  participant DB as Postgres

  Client->>Executor: spin { requestId, gameId, spinId, betAmount }
  Executor->>Redis: reserve idempotency key
  Executor->>Spin: handle spin
  Spin->>Redis: get active round
  Spin->>DB: check if spinId already completed
  Spin->>Wallet: deduct bet
  Spin->>Spin: roll symbols and calculate win
  opt winAmount > 0
    Spin->>Wallet: credit win
  end
  Spin->>DB: save spin + round action + outbox event
  Spin->>Redis: update active round
  Executor->>Redis: store completed response
  Executor-->>Client: spin result
  Spin->>Redis: publish spin completed event
```

## Idempotency

```mermaid
flowchart TD
  A["Request received"]
  B["Build idempotency key"]
  C{"Completed before?"}
  D{"Pending now?"}
  E["Reserve key"]
  F["Run action"]
  G["Store response"]
  H["Return response"]

  A --> B
  B --> C
  C -- yes --> H
  C -- no --> D
  D -- yes --> H
  D -- no --> E
  E --> F
  F --> G
  G --> H
```

## Realtime Room Notification

```mermaid
flowchart LR
  A["Task A\nplayer sends spin"]
  Redis["Redis pub/sub"]
  B["Task B"]
  RoomA["RoomRegistry A"]
  RoomB["RoomRegistry B"]
  ClientA["same-room clients on A"]
  ClientB["same-room clients on B"]

  A -->|"publish room event"| Redis
  Redis --> A
  Redis --> B
  A --> RoomA --> ClientA
  B --> RoomB --> ClientB
```

Each game-service task only notifies the WebSocket connections it owns.

## Storage

```text
Redis
  idempotency keys
  active round cache
  pub/sub room events

Postgres
  room membership
  completed spins
  round action history
  outbox events

DynamoDB
  flexible player/game persistent data
```

