import os
import threading

import pymysql
import pymysql.cursors
from dotenv import load_dotenv

load_dotenv()

_local = threading.local()


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
    conn = _get_thread_connection()
    cursor = conn.cursor()
    try:
        yield cursor
    finally:
        cursor.close()
