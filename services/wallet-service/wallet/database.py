import psycopg
from psycopg.rows import dict_row

from wallet.config import DATABASE_URL


def connection():
    return psycopg.connect(DATABASE_URL, row_factory=dict_row)


def migrate():
    with connection() as conn:
        conn.execute(
            """
            create table if not exists wallets (
              user_id text primary key,
              balance bigint not null,
              created_at timestamptz not null default now(),
              updated_at timestamptz not null default now()
            )
            """
        )
        conn.execute(
            """
            create table if not exists wallet_transactions (
              transaction_id text primary key,
              user_id text not null references wallets(user_id),
              type text not null,
              amount bigint not null,
              balance_after bigint not null,
              reference_id text,
              game_id text,
              created_at timestamptz not null default now()
            )
            """
        )
        conn.execute(
            """
            create table if not exists jackpot_configs (
              id bigserial primary key,
              game_id text not null,
              jackpot_name text not null,
              contribution_percent numeric(8, 4) not null,
              current_amount bigint not null,
              active boolean not null default true,
              created_at timestamptz not null default now(),
              unique(game_id, jackpot_name)
            )
            """
        )
        conn.execute(
            """
            create table if not exists jackpot_contributions (
              id bigserial primary key,
              jackpot_config_id bigint not null references jackpot_configs(id),
              transaction_id text not null references wallet_transactions(transaction_id),
              amount bigint not null,
              created_at timestamptz not null default now(),
              unique(jackpot_config_id, transaction_id)
            )
            """
        )
        conn.commit()
