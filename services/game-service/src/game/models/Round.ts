export interface ActiveRound {
  roundId: string;
  userId: string;
  roomId: string;
  status: 'ACTIVE';
  spinCount: number;
}
