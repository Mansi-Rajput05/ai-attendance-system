import os
import cv2
import torch
import sqlite3
import numpy as np

from src.anti_spoof_predict import AntiSpoofPredict
from src.generate_patches import CropImage
from src.utility import parse_model_name

from recognition.embeddings import get_face_embedding

# ---------------- DATABASE ---------------- #

connection = sqlite3.connect(
    "database/attendance.db"
)

cursor = connection.cursor()

# ---------------- INPUT ---------------- #

name = input("Enter your name: ")

# ---------- UNIQUE ID CHECK ---------- #

while True:

    student_id = int(
        input("Enter Student ID: ")
    )

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

# ---------------- LOAD ANTI SPOOF ---------------- #

model_dir = "resources/anti_spoof_models"

model_test = AntiSpoofPredict(0)

image_cropper = CropImage()

# ---------------- CAMERA ---------------- #

cap = cv2.VideoCapture(0)

# ---------------- MAIN LOOP ---------------- #

while True:

    ret, frame = cap.read()

    if not ret:
        break

    frame = cv2.flip(frame, 1)

    anti_spoof_text = "CHECKING..."
    anti_spoof_color = (0,165,255)

    real_face = False

    try:

        # ---------------- FACE BOUNDING BOX ---------------- #

        image_bbox = model_test.get_bbox(frame)

        x, y, w, h = image_bbox

        x1 = x
        y1 = y
        x2 = x + w
        y2 = y + h

        # ---------------- MODERN FACE BOX ---------------- #

        line_length = 25
        thickness = 2
        color = (0,255,0)

        # TOP LEFT
        cv2.line(frame, (x1,y1), (x1+line_length,y1), color, thickness)
        cv2.line(frame, (x1,y1), (x1,y1+line_length), color, thickness)

        # TOP RIGHT
        cv2.line(frame, (x2,y1), (x2-line_length,y1), color, thickness)
        cv2.line(frame, (x2,y1), (x2,y1+line_length), color, thickness)

        # BOTTOM LEFT
        cv2.line(frame, (x1,y2), (x1+line_length,y2), color, thickness)
        cv2.line(frame, (x1,y2), (x1,y2-line_length), color, thickness)

        # BOTTOM RIGHT
        cv2.line(frame, (x2,y2), (x2-line_length,y2), color, thickness)
        cv2.line(frame, (x2,y2), (x2,y2-line_length), color, thickness)

        prediction = torch.zeros((1, 3))

        # ---------------- ANTI SPOOF PREDICTION ---------------- #

        for model_name in os.listdir(model_dir):

            h_input, w_input, model_type, scale = parse_model_name(
                model_name
            )

            param = {
                "org_img": frame,
                "bbox": image_bbox,
                "scale": scale,
                "out_w": w_input,
                "out_h": h_input,
                "crop": True,
            }

            img = image_cropper.crop(**param)

            prediction += model_test.predict(
                img,
                os.path.join(model_dir, model_name)
            )

        label = torch.argmax(prediction).item()

        # ---------------- REAL FACE ---------------- #

        if label == 1:

            anti_spoof_text = "REAL FACE"
            anti_spoof_color = (0,255,0)

            real_face = True

        # ---------------- FAKE FACE ---------------- #

        else:

            anti_spoof_text = "FAKE FACE"
            anti_spoof_color = (0,0,255)

            real_face = False

    except Exception as e:

        anti_spoof_text = "NO FACE DETECTED"
        anti_spoof_color = (0,165,255)

        print("Error:", e)

    # ---------------- GLASS EFFECT PANEL ---------------- #

    overlay = frame.copy()

    cv2.rectangle(
        overlay,
        (0, frame.shape[0] - 160),
        (frame.shape[1], frame.shape[0]),
        (40,40,40),
        -1
    )

    alpha = 0.35

    frame = cv2.addWeighted(
        overlay,
        alpha,
        frame,
        1 - alpha,
        0
    )

    # ---------------- STATUS ---------------- #

    cv2.putText(
        frame,
        f"STATUS : {anti_spoof_text}",
        (40, frame.shape[0] - 120),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.75,
        anti_spoof_color,
        2
    )

    # ---------------- NAME ---------------- #

    cv2.putText(
        frame,
        f"NAME : {name}",
        (40, frame.shape[0] - 85),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.65,
        (255,255,255),
        2
    )

    # ---------------- ID ---------------- #

    cv2.putText(
        frame,
        f"ID : {student_id}",
        (40, frame.shape[0] - 50),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.65,
        (255,255,255),
        2
    )

    # ---------------- INSTRUCTION ---------------- #

    cv2.putText(
        frame,
        "PRESS S TO REGISTER",
        (40, frame.shape[0] - 15),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.65,
        (0,255,255),
        2
    )

    # ---------------- SHOW WINDOW ---------------- #

    cv2.imshow(
        "Secure Face Registration",
        frame
    )

    key = cv2.waitKey(1)

    # ---------------- SAVE FACE ---------------- #

    if key == ord('s'):

        if real_face:

            embedding = get_face_embedding(frame)

            if embedding is not None:

                # ---------- NORMALIZE ---------- #

                embedding = embedding / np.linalg.norm(
                    embedding
                )

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

                print("Face Registered Successfully")

                break

            else:

                print("Face embedding failed")

        else:

            print("Registration blocked: Fake face detected")

# ---------------- CLEANUP ---------------- #

connection.close()

cap.release()

cv2.destroyAllWindows()