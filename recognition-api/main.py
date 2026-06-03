import os
import cv2
import torch
import numpy as np

from src.anti_spoof_predict import AntiSpoofPredict
from src.generate_patches import CropImage
from src.utility import parse_model_name
from database.paths import ANTI_SPOOF_MODEL_DIR

from recognition.recognize import (
    load_known_faces,
    recognize_face
)

# ---------------- LOAD RECOGNITION DATABASE ---------------- #

known_faces = load_known_faces()

# ---------------- LOAD ANTI SPOOF MODELS ---------------- #

model_dir = ANTI_SPOOF_MODEL_DIR

model_test = AntiSpoofPredict(0)

image_cropper = CropImage()

# ---------------- CAMERA ---------------- #

cap = cv2.VideoCapture(0)

attendance_marked = False

recognized_name = "Unknown"
recognized_id = "N/A"
attendance_status = ""

stable_name = ""
stable_count = 0

REQUIRED_FRAMES = 5

# ---------------- MAIN LOOP ---------------- #

while True:

    ret, frame = cap.read()

    if not ret:
        break

    frame = cv2.flip(frame, 1)

    try:

        # ---------------- FACE BOUNDING BOX ---------------- #

        image_bbox = model_test.get_bbox(frame)
        x, y, w, h = image_bbox

        x1 = x
        y1 = y
        x2 = x + w
        y2 = y + h

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

            # ---------- FACE RECOGNITION ---------- #

            if not attendance_marked:

                temp_name, temp_id, temp_status = recognize_face(
                    frame,
                    known_faces
                )

                # ---------- STABILIZATION ---------- #

                if temp_name == stable_name:

                    stable_count += 1

                elif temp_name != "Unknown":

                    stable_name = temp_name
                    stable_count = 1

                # ---------- CONFIRM RECOGNITION ---------- #

                if stable_count >= REQUIRED_FRAMES:

                    recognized_name = temp_name
                    recognized_id = temp_id
                    attendance_status = temp_status

                    if recognized_name != "Unknown":

                        attendance_marked = True

                # ---------- STILL SCANNING ---------- #

                if stable_count < REQUIRED_FRAMES:

                    recognized_name = "SCANNING..."
                    recognized_id = "..."


        # ---------------- FAKE FACE ---------------- #

        else:

            anti_spoof_text = "FAKE FACE"
            anti_spoof_color = (0,0,255)

            recognized_name = "Unknown"
            recognized_id = "N/A"
            attendance_status = ""

            attendance_marked = False

    except Exception as e:

        anti_spoof_text = "NO FACE DETECTED"
        anti_spoof_color = (0,165,255)

        recognized_name = "Unknown"
        recognized_id = "N/A"
        attendance_status = ""

        print("Error:", e)

    # ---------------- DISPLAY ---------------- #

    # ---------------- CREATE UI PANEL ---------------- #

    panel_height = 140

    panel = np.zeros(
        (panel_height, frame.shape[1], 3),
        dtype=np.uint8
    )

    # ---------------- GLASS EFFECT ---------------- #

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
    # ---------------- STATUS COLOR ---------------- #

    status_color = anti_spoof_color


    # ---------------- STATUS ---------------- #

    cv2.putText(
       frame,
        f"STATUS : {anti_spoof_text}",
        (40, frame.shape[0] - 120),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.75,
        status_color,
        2
    )

    # ---------------- NAME ---------------- #

    cv2.putText(
        frame,
        f"NAME : {recognized_name}",
        (40, frame.shape[0] - 85),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.65,
        (255,255,255),
        2
    )

    # ---------------- ID ---------------- #

    cv2.putText(
        frame,
        f"ID : {recognized_id}",
        (40, frame.shape[0] - 50),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.65,
        (255,255,255),
        2
    )

    # ---------------- ATTENDANCE ---------------- #

    cv2.putText(
        frame,
        f"ATTENDANCE : {attendance_status}",
        (40, frame.shape[0] - 15),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.65,
        (0,255,255),
        2
    )

    # ---------------- SHOW WINDOW ---------------- #

    cv2.imshow(
        "AI Attendance System",
        frame
    )

    if cv2.waitKey(1) & 0xFF == ord('d') :
        break

# ---------------- CLEANUP ---------------- #

cap.release()

cv2.destroyAllWindows()
