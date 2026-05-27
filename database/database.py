import sqlite3
import os

DB_PATH = os.path.join(
    os.path.dirname(__file__),
    "attendance.db"
)

connection = sqlite3.connect(DB_PATH)

cursor = connection.cursor()

cursor.execute("""

CREATE TABLE IF NOT EXISTS users (

    student_id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    embedding BLOB NOT NULL

)

""")

cursor.execute("""

CREATE TABLE IF NOT EXISTS attendance (

    attendance_id INTEGER PRIMARY KEY AUTOINCREMENT,

    student_id INTEGER NOT NULL,

    date TEXT NOT NULL,
    time TEXT NOT NULL,

    FOREIGN KEY (student_id)
    REFERENCES users(student_id)

)

""")

connection.commit()
connection.close()