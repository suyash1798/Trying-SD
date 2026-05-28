import psycopg
from psycopg.rows import dict_row

from user.config import DATABASE_URL


def connection():
    return psycopg.connect(DATABASE_URL, row_factory=dict_row)


def migrate():
    with connection() as conn:
        conn.execute(
            """
            create table if not exists players (
              player_id text primary key,
              device_id text not null unique,
              created_at timestamptz not null default now(),
              last_seen_at timestamptz not null default now()
            )
            """
        )
        conn.commit()
