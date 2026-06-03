import sqlite3

from database.paths import DB_PATH

connection = sqlite3.connect(DB_PATH)

cursor = connection.cursor()

cursor.execute(
    """

    SELECT
        attendance.student_id,
        users.name,
        attendance.date,
        attendance.time

    FROM attendance

    JOIN users

    ON attendance.student_id = users.student_id

    """
)

records = cursor.fetchall()

print("\n===== ATTENDANCE RECORDS =====\n")

for record in records:

    student_id = record[0]
    name = record[1]
    date = record[2]
    time = record[3]

    print(
        f"""
ID: {student_id}
Name: {name}
Date: {date}
Time: {time}
------------------------
"""
    )

connection.close()
