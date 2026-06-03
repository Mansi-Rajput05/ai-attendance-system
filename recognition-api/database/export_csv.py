import sqlite3
import csv

from database.paths import CSV_PATH, DB_PATH

def export_csv():

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

    with open(
        CSV_PATH,
        mode="w",
        newline=""
    ) as file:

        writer = csv.writer(file)

        writer.writerow([
            "Student ID",
            "Name",
            "Date",
            "Time"
        ])

        writer.writerows(records)

    connection.close()

    print("CSV Exported Successfully")
