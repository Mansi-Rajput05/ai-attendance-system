import sqlite3
import numpy as np

from recognition.embeddings import get_face_embedding
from database.attendance_logger import mark_attendance

SIMILARITY_THRESHOLD = 0.8


def load_known_faces():

    connection = sqlite3.connect(
        "database/attendance.db"
    )

    cursor = connection.cursor()

    cursor.execute(
        "SELECT student_id, name, embedding FROM users"
    )

    users = cursor.fetchall()

    connection.close()

    known_faces = []

    for student_id, name, embedding_blob in users:

        embedding_array = np.frombuffer(
            embedding_blob,
            dtype=np.float32
        )

        embedding_array = embedding_array / np.linalg.norm(
            embedding_array
        )

        known_faces.append(
            (
                student_id,
                name,
                embedding_array
            )
        )

    return known_faces


def recognize_face(frame, known_faces):

    embedding = get_face_embedding(frame)
    embedding = embedding / np.linalg.norm(embedding)

    print("Current embedding:")
    print(embedding)
    
    recognized_name = "Unknown"
    recognized_id = "N/A"
    attendance_status = ""

    if embedding is not None:

        best_similarity = 999

        for stored_id, stored_name, stored_embedding in known_faces:

            distance = np.linalg.norm(
                embedding - stored_embedding
            )
            print("Distance:", distance)

            if distance < best_similarity:

                best_similarity = distance

                recognized_name = stored_name
                recognized_id = stored_id

        print("Best similarity:", best_similarity)

        # ---------- UNKNOWN CHECK ---------- #

        if best_similarity > SIMILARITY_THRESHOLD:

            recognized_name = "Unknown"
            recognized_id = "N/A"

        else:

            attendance_status = mark_attendance(
                recognized_id
            )

    return (
        recognized_name,
        recognized_id,
        attendance_status
    )
