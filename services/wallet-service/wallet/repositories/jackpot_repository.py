from decimal import Decimal, ROUND_DOWN


class JackpotRepository:
    def save_config(self, conn, game_id: str, jackpot_name: str, initial_amount: int, contribution_percent: Decimal):
        return conn.execute(
            """
            insert into jackpot_configs (
              game_id,
              jackpot_name,
              contribution_percent,
              current_amount
            )
            values (%s, %s, %s, %s)
            on conflict (game_id, jackpot_name)
            do update set
              contribution_percent = excluded.contribution_percent,
              current_amount = excluded.current_amount,
              active = true
            returning game_id, jackpot_name, contribution_percent, current_amount, active
            """,
            (game_id, jackpot_name, contribution_percent, initial_amount),
        ).fetchone()

    def list_by_game(self, conn, game_id: str):
        return conn.execute(
            """
            select game_id, jackpot_name, contribution_percent, current_amount, active
            from jackpot_configs
            where game_id = %s
            order by jackpot_name
            """,
            (game_id,),
        ).fetchall()

    def contribute(self, conn, game_id: str | None, transaction_id: str, bet_amount: int):
        if not game_id:
            return []

        jackpots = conn.execute(
            """
            select id, jackpot_name, contribution_percent, current_amount
            from jackpot_configs
            where game_id = %s and active = true
            for update
            """,
            (game_id,),
        ).fetchall()

        contributions = []

        for jackpot in jackpots:
            contribution = self._contribution_amount(bet_amount, jackpot["contribution_percent"])

            if contribution <= 0:
                continue

            next_amount = jackpot["current_amount"] + contribution
            conn.execute(
                "update jackpot_configs set current_amount = %s where id = %s",
                (next_amount, jackpot["id"]),
            )
            conn.execute(
                """
                insert into jackpot_contributions (
                  jackpot_config_id,
                  transaction_id,
                  amount
                )
                values (%s, %s, %s)
                on conflict do nothing
                """,
                (jackpot["id"], transaction_id, contribution),
            )
            contributions.append(
                {
                    "jackpotName": jackpot["jackpot_name"],
                    "amount": contribution,
                    "currentAmount": next_amount,
                }
            )

        return contributions

    def _contribution_amount(self, bet_amount: int, percent: Decimal):
        contribution = Decimal(bet_amount) * percent / Decimal(100)
        return int(contribution.quantize(Decimal("1"), rounding=ROUND_DOWN))
