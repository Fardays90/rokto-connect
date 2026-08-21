import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
import pymysql
import pymysql.cursors
from dotenv import load_dotenv

load_dotenv()
db_connection = None

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
        ssl={"ssl": True}
    )

def init_db():
    global db_connection
    print("Connecting to Aiven MySQL Database...")
    db_connection = get_db_connection()
    print("Successfully connected to MySQL!")
def close_db():
    global db_connection
    if db_connection and db_connection.open:
        db_connection.close()
        print("MySQL connection closed.")
def get_cursor():
    global db_connection
    if db_connection is None or not db_connection.open:
        db_connection = get_db_connection()
    else:
        db_connection.ping(reconnect=True)
    cursor = db_connection.cursor()
    try:
        yield cursor
    finally:
        cursor.close()