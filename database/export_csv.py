import sqlite3
import csv

def export_csv():

    connection = sqlite3.connect(
        "database/attendance.db"
    )

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
        "database/attendance_report.csv",
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