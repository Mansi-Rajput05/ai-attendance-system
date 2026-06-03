import sqlite3
from datetime import datetime
from database.export_csv import export_csv
from database.paths import DB_PATH


def mark_attendance(student_id):

    connection = sqlite3.connect(DB_PATH)

    cursor = connection.cursor()

    # ---------- CURRENT DATE/TIME ---------- #

    current_date = datetime.now().strftime(
        "%Y-%m-%d"
    )

    current_time = datetime.now().strftime(
        "%H:%M:%S"
    )

    # ---------- CHECK DUPLICATE ---------- #

    cursor.execute(
        """

        SELECT * FROM attendance

        WHERE student_id = ?
        AND date = ?

        """,
        (
            student_id,
            current_date
        )
    )

    existing_record = cursor.fetchone()

    # ---------- NEW ATTENDANCE ---------- #

    if existing_record is None:

        cursor.execute(
            """

            INSERT INTO attendance
            (student_id, date, time)

            VALUES (?, ?, ?)

            """,
            (
                student_id,
                current_date,
                current_time
            )
        )

        connection.commit()
        connection.close()
        export_csv()


        return "MARKED"

    # ---------- ALREADY MARKED ---------- #

    else:

        connection.close()

        return "ALREADY_MARKED"
