export interface WalletResponse {
  userId: string;
  balance: number;
  jackpotContributions?: {
    jackpotName: string;
    amount: number;
    currentAmount: number;
  }[];
}
