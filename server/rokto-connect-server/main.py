import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Depends
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
@asynccontextmanager
async def lifespan(app: FastAPI):
    global db_connection
    print("Connecting to Aiven MySQL Database...")
    try:
        db_connection = get_db_connection()
        print("Successfully connected to MySQL!")
    except Exception as e:
        print(f"Failed to connect to MySQL: {e}")
        raise e
    yield 
    if db_connection and db_connection.open:
        db_connection.close()
        print("MySQL connection closed.")
app = FastAPI(title="Rokto Connect API", lifespan=lifespan)
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
@app.get("/")
def read_root():
    return {"status": "online", "message": "Rokto Connect API is up and running"}

@app.get("/health/db")
def check_db_health(cursor=Depends(get_cursor)):
    try:
        cursor.execute("SELECT 1 AS status")
        result = cursor.fetchone()
        return {"database": "connected", "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database query failed: {str(e)}")