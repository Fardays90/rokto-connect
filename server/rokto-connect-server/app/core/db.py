import os
import threading

import pymysql
import pymysql.cursors
from dotenv import load_dotenv

load_dotenv()

_local = threading.local()

# connection-level failures we can safely recover from by reconnecting:
# 2006 "server has gone away", 2013 "lost connection during query"
RECOVERABLE_ERRORS = (2006, 2013)

# only SELECT-type statements are replayed on a fresh connection — replaying
# a failed INSERT/UPDATE/DELETE could apply it twice
_RETRYABLE_PREFIXES = ("SELECT", "SHOW")


def get_db_connection():
    return pymysql.connect(
        host=os.getenv("DB_HOST"),
        port=int(os.getenv("DB_PORT", 3306)),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME"),
        charset="utf8mb4",
        connect_timeout=10,
        cursorclass=pymysql.cursors.DictCursor,
        ssl={"ssl": True},
        init_command="SET time_zone = '+00:00'",
        autocommit=True,
    )


def _get_thread_connection():
    conn = getattr(_local, "conn", None)
    if conn is not None:
        try:
            conn.ping(reconnect=True)
            return conn
        except Exception:
            try:
                conn.close()
            except Exception:
                pass
            _local.conn = None

    conn = get_db_connection()
    _local.conn = conn
    return conn


def _drop_thread_connection():
    """Forcefully discard this thread's pooled connection.

    Used after the socket died mid-query — the next access builds a fresh one.
    """
    conn = getattr(_local, "conn", None)
    if conn is not None:
        try:
            conn.close()
        except Exception:
            pass
        _local.conn = None


class SelfHealingCursor:
    """Wraps a pymysql cursor and survives dropped connections.

    Long-lived connections to a cloud MySQL occasionally die mid-query
    (idle NAT/firewall timeouts, network churn). When that happens during a
    SELECT, rebuild the thread's connection once and run the query again so
    callers never see the error. Everything else passes straight through.
    """

    def __init__(self):
        self._cursor = _get_thread_connection().cursor()

    def execute(self, query, params=None):
        try:
            return self._cursor.execute(query, params)
        except pymysql.err.OperationalError as error:
            if error.args and error.args[0] in RECOVERABLE_ERRORS \
                    and query.lstrip().upper().startswith(_RETRYABLE_PREFIXES):
                # the pooled socket is dead — throw it away and retry once
                _drop_thread_connection()
                self._cursor = _get_thread_connection().cursor()
                return self._cursor.execute(query, params)
            raise

    def __getattr__(self, name):
        # delegate everything else (fetchall, lastrowid, connection, ...)
        # to the current underlying cursor; looked up dynamically so calls
        # after an internal reconnect see the new cursor/connection
        return getattr(self._cursor, name)


def init_db():
    print("Connecting to Aiven MySQL Database...")
    _get_thread_connection()
    print("Successfully connected to MySQL!")


def close_db():
    conn = getattr(_local, "conn", None)
    if conn is not None and conn.open:
        conn.close()
        print("MySQL connection closed.")


def get_cursor():
    cursor = SelfHealingCursor()
    try:
        yield cursor
    finally:
        cursor.close()
