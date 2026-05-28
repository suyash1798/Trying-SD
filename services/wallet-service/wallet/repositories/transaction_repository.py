class TransactionRepository:
    def get(self, conn, transaction_id: str):
        return conn.execute(
            """
            select transaction_id, user_id, balance_after
            from wallet_transactions
            where transaction_id = %s
            """,
            (transaction_id,),
        ).fetchone()

    def insert(
        self,
        conn,
        transaction_id: str,
        user_id: str,
        transaction_type: str,
        amount: int,
        balance_after: int,
        reference_id: str | None,
        game_id: str | None,
    ):
        conn.execute(
            """
            insert into wallet_transactions (
              transaction_id,
              user_id,
              type,
              amount,
              balance_after,
              reference_id,
              game_id
            )
            values (%s, %s, %s, %s, %s, %s, %s)
            """,
            (
                transaction_id,
                user_id,
                transaction_type,
                amount,
                balance_after,
                reference_id,
                game_id,
            ),
        )
