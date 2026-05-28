export interface CompletedSpin {
  userId: string;
  roomId: string;
  roundId: string;
  gameId: string;
  requestId: string;
  spinId: string;
  betAmount: number;
  winAmount: number;
  symbols: string[];
  balance: number;
}
