import cv2 as cv
import sqlite3
import numpy as np


# ---------------- DATABASE ---------------- #

connection = sqlite3.connect(
    "database/attendance.db"
)

cursor = connection.cursor()

# ---------------- INPUT ---------------- #

print("\n========== FACE REGISTRATION ==========\n")

name = input("Enter your name: ")

# ---------- UNIQUE ID CHECK ---------- #

while True:

    try:

        student_id = int(
            input("Enter Student ID: ")
        )

    except ValueError:

        print("Please enter numeric ID")
        continue

    cursor.execute(
        "SELECT * FROM users WHERE student_id = ?",
        (student_id,)
    )

    existing_user = cursor.fetchone()

    if existing_user is None:

        break

    else:

        print("ID already exists")
        print("Please enter another ID")


from recognition.embeddings import get_face_embedding

from detection.face_mesh import process_face_mesh
from detection.blink_detector import calculate_ear
from detection.head_pose import estimate_head_pose

import anti_spoof.liveness as liveness


# ---------------- CAMERA ---------------- #

capture = cv.VideoCapture(0)

capture.set(cv.CAP_PROP_FRAME_WIDTH, 640)
capture.set(cv.CAP_PROP_FRAME_HEIGHT, 480)

registration_complete = False
success_message = ""

frame_counter = 0

while True:

    frame_counter += 1

    if frame_counter % 2 != 0:
        continue

    isTrue, frame = capture.read()

    if not isTrue:
        break

    frame = cv.flip(frame, 1)

    rgb_frame = cv.cvtColor(
        frame,
        cv.COLOR_BGR2RGB
    )

    results = process_face_mesh(rgb_frame)

    if results.multi_face_landmarks:

        for face_landmarks in results.multi_face_landmarks:

            h, w, c = frame.shape

            # ---------- EAR ---------- #

            ear, eye_points = calculate_ear(
                face_landmarks,
                w,
                h
            )

            # ---------- DRAW EYE POINTS ---------- #

            for point in eye_points:

                cv.circle(
                    frame,
                    point,
                    3,
                    (0,255,0),
                    -1
                )

            # ---------- HEAD POSE ---------- #

            x_angle, y_angle, z_angle = estimate_head_pose(
                face_landmarks,
                w,
                h
            )

            # ---------- HEAD DIRECTION ---------- #

            head_direction = "Forward"

            if y_angle < -10:

                head_direction = "Looking Left"

            elif y_angle > 10:

                head_direction = "Looking Right"

            elif x_angle < -10:

                head_direction = "Looking Down"

            elif x_angle > 10:

                head_direction = "Looking Up"

            # ---------- VERIFY CHALLENGE ---------- #

            current_challenge = liveness.verify_challenge(
                ear,
                head_direction
            )

            # ---------- DISPLAY ---------- #

            cv.putText(
                frame,
                f"Challenge: {current_challenge}",
                (30, 50),
                cv.FONT_HERSHEY_SIMPLEX,
                1,
                (0,255,255),
                2
            )

            cv.putText(
                frame,
                head_direction,
                (30, 100),
                cv.FONT_HERSHEY_SIMPLEX,
                1,
                (0,255,0),
                2
            )

            # ---------- VERIFIED ---------- #

            if liveness.verification_complete:

                cv.putText(
                    frame,
                    "VERIFIED",
                    (30, 170),
                    cv.FONT_HERSHEY_SIMPLEX,
                    1.5,
                    (0,255,0),
                    3
                )

                cv.putText(
                    frame,
                    "Press S to Save Face",
                    (30, 240),
                    cv.FONT_HERSHEY_SIMPLEX,
                    1,
                    (0,255,255),
                    2
                )

                key = cv.waitKey(1)

                # ---------- SAVE FACE ---------- #

                if key == ord('s'):
                    embedding = get_face_embedding(frame)
                    embedding = embedding / np.linalg.norm(embedding)

                    if embedding is not None:

                        embedding_bytes = embedding.tobytes()

                        cursor.execute(
                            """

                            INSERT INTO users
                            (student_id, name, embedding)

                            VALUES (?, ?, ?)

                            """,
                            (
                                student_id,
                                name,
                                embedding_bytes
                            )
                        )

                        connection.commit()

                        success_message = "Face Registered Successfully"

                        print(success_message)
    
                        registration_complete = True

                        break

                    else:

                        print("No face detected")

        # ---------- OUTER LOOP BREAK ---------- #

        if registration_complete:
            break
    
    cv.putText(
    frame,
    success_message,
    (30, 320),
    cv.FONT_HERSHEY_SIMPLEX,
    1,
    (0,255,0),
    2
    )

    cv.imshow(
        "Secure Face Registration",
        frame
    )

    if cv.waitKey(1) & 0xFF == ord('d'):
        break

# ---------------- CLEANUP ---------------- #

connection.close()

capture.release()

cv.destroyAllWindows()