from wallet.config import DEFAULT_BALANCE


class WalletRepository:
    def get_or_create_wallet(self, conn, user_id: str):
        wallet = conn.execute(
            """
            insert into wallets (user_id, balance)
            values (%s, %s)
            on conflict (user_id) do nothing
            returning user_id, balance
            """,
            (user_id, DEFAULT_BALANCE),
        ).fetchone()

        if wallet:
            return wallet

        return conn.execute(
            "select user_id, balance from wallets where user_id = %s for update",
            (user_id,),
        ).fetchone()

    def update_balance(self, conn, user_id: str, balance: int):
        conn.execute(
            """
            update wallets
            set balance = %s, updated_at = now()
            where user_id = %s
            """,
            (balance, user_id),
        )
