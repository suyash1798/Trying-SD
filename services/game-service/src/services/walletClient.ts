import fetch from 'node-fetch';
import AppError from '../errors/AppError';
import { WalletResponse } from '../types/wallet';

class WalletClient {
  private readonly baseUrl: string;

  constructor(baseUrl: string ) {
    this.baseUrl = baseUrl;
  }

  async deduct({
    userId,
    amount,
    transactionId,
    gameId,
    referenceId
  }: {
    userId: string;
    amount: number;
    transactionId: string;
    gameId: string;
    referenceId?: string;
  }): Promise<WalletResponse> {
    if (!userId) {
      throw new Error('userId required');
    }

    return this.post('/deduct', {
      userId,
      amount,
      transactionId,
      gameId,
      referenceId
    });
  }

  async credit({
    userId,
    amount,
    transactionId,
    referenceId
  }: {
    userId: string;
    amount: number;
    transactionId: string;
    referenceId?: string;
  }): Promise<WalletResponse> {
    if (!userId) {
      throw new Error('userId required');
    }

    return this.post('/credit', {
      userId,
      amount,
      transactionId,
      referenceId
    });
  }

  private async post(path: string, payload: object): Promise<WalletResponse> {
    const url = `${this.baseUrl}${path}`;
    const resp = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' }
    });

    if (!resp.ok) {
      const detail = await resp.json().catch(() => null);
      throw new AppError('wallet service error', resp.status, { url, detail }, 'wallet-service');
    }

    return resp.json() as Promise<WalletResponse>;
  }
}

export default WalletClient;
