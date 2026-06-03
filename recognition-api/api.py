from pydantic import BaseModel
from typing import Optional
from fastapi import FastAPI
import os
import sqlite3
from datetime import datetime
from fastapi import UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from requests import request

os.environ.setdefault("OMP_NUM_THREADS", "1")
os.environ.setdefault("OPENBLAS_NUM_THREADS", "1")
os.environ.setdefault("MKL_NUM_THREADS", "1")
os.environ.setdefault("NUMEXPR_NUM_THREADS", "1")

from recognition.embeddings import get_face_embedding

import time 
import base64
import cv2
import numpy as np

from recognition.recognize import (
    load_known_faces,
    recognize_face
)
from database.database import init_database
from database.paths import ANTI_SPOOF_MODEL_DIR, CSV_PATH, DB_PATH

init_database()
known_faces = load_known_faces()

import torch

torch.set_num_threads(
    int(os.environ.get("TORCH_NUM_THREADS", "1"))
)

from src.anti_spoof_predict import AntiSpoofPredict
from src.generate_patches import CropImage
from src.utility import parse_model_name

model_dir = ANTI_SPOOF_MODEL_DIR

model_test = AntiSpoofPredict(0)

image_cropper = CropImage()

def check_liveness(frame):

    image_bbox = model_test.get_bbox(frame)

    prediction = torch.zeros((1, 3))

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

    return label == 1

app = FastAPI()

allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

if os.environ.get("FRONTEND_URL"):
    allowed_origins.append(
        os.environ["FRONTEND_URL"]
    )

if os.environ.get("VERCEL_URL"):
    allowed_origins.append(
        f"https://{os.environ['VERCEL_URL']}"
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():

    return {
        "message": "AI Attendance System API"
    }


@app.get("/students")
def get_students():

    connection = sqlite3.connect(DB_PATH)

    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT student_id, name
        FROM users
        """
    )

    students = cursor.fetchall()

    connection.close()

    result = []

    for student in students:

        result.append(
            {
                "student_id": student[0],
                "name": student[1]
            }
        )

    return result


@app.get("/attendance")
def get_attendance(

    student_id: Optional[int] = None,

    date: Optional[str] = None

):

    connection = sqlite3.connect(DB_PATH)

    cursor = connection.cursor()

    query = """

    SELECT
        attendance.student_id,
        users.name,
        attendance.date,
        attendance.time

    FROM attendance

    JOIN users

    ON attendance.student_id = users.student_id

    """

    conditions = []
    params = []

    if student_id is not None:

        conditions.append(
            "attendance.student_id = ?"
        )

        params.append(
            student_id
        )

    if date is not None:

        conditions.append(
            "attendance.date = ?"
        )

        params.append(
            date
        )

    if len(conditions) > 0:

        query += " WHERE "

        query += " AND ".join(
            conditions
        )

    cursor.execute(
        query,
        params
    )

    records = cursor.fetchall()

    connection.close()

    result = []

    for record in records:

        result.append(
            {
                "student_id": record[0],
                "name": record[1],
                "date": record[2],
                "time": record[3]
            }
        )

    return result



@app.get("/student/{student_id}")
def get_student(student_id: int):

    connection = sqlite3.connect(DB_PATH)

    cursor = connection.cursor()

    cursor.execute(
        """

        SELECT student_id, name

        FROM users

        WHERE student_id = ?

        """,
        (student_id,)
    )

    student = cursor.fetchone()

    connection.close()

    if student is None:

        return {
            "message": "Student not found"
        }

    return {
        "student_id": student[0],
        "name": student[1]
    }

class Candidate(BaseModel):

    studentId: str
    name: str
    embedding: list[float]


class ScanRequest(BaseModel):

    frames: list[str]
    candidates: Optional[list[Candidate]] = None

@app.post("/recognize")
def recognize(request: ScanRequest):

    frames = []

    # ---------- DECODE FRAMES ---------- #
    decode_start = time.time()

    for frame_data in request.frames:

        try:

            frame_data = frame_data.split(",")[1]

            image_bytes = base64.b64decode(
                frame_data
            )

            np_array = np.frombuffer(
                image_bytes,
                np.uint8
            )

            frame = cv2.imdecode(
                np_array,
                cv2.IMREAD_COLOR
            )

            if frame is not None:

                frames.append(frame)

        except Exception:

            continue

    print(
    "Decode Time:",
    round(time.time() - decode_start, 2),
    "sec"
)

    # ---------- VALIDATION ---------- #

    if len(frames) == 0:

        return {
            "status": "NO_FRAME_RECEIVED"
        }

    # ---------- MIDDLE FRAME ---------- #

    middle_frame = frames[
        len(frames) // 2
    ]

    # ---------- ANTI SPOOF ---------- #

    try:
        start = time.time()

        is_real = check_liveness(
            middle_frame
        )
        print(
    "Liveness Time:",
    round(time.time() - start, 2),
    "sec"
)
        if not is_real:

            return {
                "status": "FAKE_FACE"
            }

    except Exception:

        return {
            "status": "NO_FACE_DETECTED"
        }

    # ---------- FAST CANDIDATE RECOGNITION ---------- #

    if request.candidates:

        start = time.time()

        embedding = get_face_embedding(
            middle_frame
        )

        if embedding is None:

            return {
                "status": "NO_FACE_DETECTED"
            }

        embedding = embedding / np.linalg.norm(
            embedding
        )

        valid_candidates = []
        stored_embeddings = []

        for candidate in request.candidates:

            stored = np.array(
                candidate.embedding,
                dtype=np.float32
            )

            stored_norm = np.linalg.norm(
                stored
            )

            if stored_norm == 0:

                continue

            valid_candidates.append(
                candidate
            )

            stored_embeddings.append(
                stored / stored_norm
            )

        if len(stored_embeddings) == 0:

            return {
                "status": "UNKNOWN_FACE",
                "distance": float("inf")
            }

        distances = np.linalg.norm(
            np.vstack(stored_embeddings) - embedding,
            axis=1
        )

        best_index = int(
            np.argmin(distances)
        )

        best_distance = float(
            distances[best_index]
        )

        best_candidate = valid_candidates[
            best_index
        ]

        print(
            "Candidate Recognition Time:",
            round(time.time() - start, 2),
            "sec"
        )

        if best_distance > 0.7:

            return {
                "status": "UNKNOWN_FACE",
                "distance": best_distance
            }

        return {
            "status": "REAL_FACE",
            "studentId": best_candidate.studentId,
            "student_id": best_candidate.studentId,
            "name": best_candidate.name,
            "distance": best_distance
        }

    # ---------- SQLITE FALLBACK RECOGNITION ---------- #
    start = time.time()

    recognized_name, recognized_id, attendance_status = recognize_face(
        middle_frame,
        known_faces
    )
    print(
    "Recognition Time:",
    round(time.time() - start, 2),
    "sec"
)

    # ---------- UNKNOWN ---------- #

    if recognized_name == "Unknown":

        return {
            "status": "UNKNOWN_FACE",
            "name": "Unknown",
            "student_id": "N/A",
            "attendance_status": ""
        }

    # ---------- SUCCESS ---------- #

    return {
        "status": "REAL_FACE",
        "name": recognized_name,
        "student_id": recognized_id,
        "attendance_status": attendance_status
    }

class RegisterRequest(BaseModel):

    student_id: Optional[int] = None
    studentId: Optional[int] = None
    name: Optional[str] = None
    frames: list[str]


@app.post("/register")
def register_student(
    request: RegisterRequest
):

    student_id = (
        request.student_id
        if request.student_id is not None
        else request.studentId
    )

    student_name = request.name.strip() if request.name else ""

    decoded_frames = []

    # ---------- DECODE FRAMES ---------- #

    for frame_data in request.frames:

        try:

            frame_data = frame_data.split(",")[1]

            image_bytes = base64.b64decode(
                frame_data
            )

            np_array = np.frombuffer(
                image_bytes,
                np.uint8
            )

            frame = cv2.imdecode(
                np_array,
                cv2.IMREAD_COLOR
            )

            if frame is None:
                continue

            decoded_frames.append(
                frame
            )

        except Exception:

            continue

    # ---------- NO VALID FRAME ---------- #

    if len(decoded_frames) < 3:

        return {
            "status": "NO_FACE_DETECTED"
        }

    # ---------- MIDDLE FRAME ---------- #

    middle_frame = decoded_frames[
        len(decoded_frames) // 2
    ]

    # ---------- ANTI SPOOF ---------- #

    try:

        if not check_liveness(middle_frame):

            return {
                "status": "FAKE_FACE"
            }

    except Exception:

        return {
            "status": "NO_FACE_DETECTED"
        }

    # ---------- EMBEDDING ---------- #

    embedding = get_face_embedding(
        middle_frame
    )

    if embedding is None:

        return {
            "status": "NO_FACE_DETECTED"
        }

    embedding = (
        embedding
        / np.linalg.norm(embedding)
    )

    embedding_bytes = embedding.tobytes()

    if student_id is None or student_name == "":

        return {
            "status": "REGISTERED",
            "message": "Face embedding generated",
            "embedding": embedding.tolist()
        }

    # ---------- DATABASE ---------- #

    connection = sqlite3.connect(DB_PATH)

    cursor = connection.cursor()

    # ---------- DUPLICATE ID CHECK ---------- #

    cursor.execute(
        """

        SELECT student_id

        FROM users

        WHERE student_id = ?

        """,
        (student_id,)
    )

    existing_student = cursor.fetchone()

    if existing_student:

        connection.close()

        return {
            "status": "STUDENT_ALREADY_EXISTS"
        }

    # ---------- INSERT ---------- #

    cursor.execute(
        """

        INSERT INTO users
        (
            student_id,
            name,
            embedding
        )

        VALUES (?, ?, ?)

        """,
        (
            student_id,
            student_name,
            embedding_bytes
        )
    )

    connection.commit()

    connection.close()

    global known_faces

    known_faces = load_known_faces()

    return {
        "status": "REGISTERED",
        "student_id": student_id,
        "name": student_name
    }



@app.delete("/students/{student_id}")
def delete_student(student_id: int):

    connection = sqlite3.connect(DB_PATH)

    cursor = connection.cursor()

    cursor.execute(
        """
        DELETE FROM users
        WHERE student_id = ?
        """,
        (student_id,)
    )

    connection.commit()

    connection.close()
    global known_faces

    known_faces = load_known_faces()

    return {
        "status": "DELETED"
    }

@app.get("/download-attendance")
def download_attendance():

    return FileResponse(
        path=CSV_PATH,
        filename="attendance_report.csv",
        media_type="text/csv"
    )


@app.get("/dashboard-stats")
def dashboard_stats():

    connection = sqlite3.connect(DB_PATH)

    cursor = connection.cursor()

    # ---------- TOTAL STUDENTS ---------- #

    cursor.execute(
        """
        SELECT COUNT(*)
        FROM users
        """
    )

    total_students = cursor.fetchone()[0]

    # ---------- TODAY ATTENDANCE ---------- #

    today = datetime.now().strftime(
        "%Y-%m-%d"
    )

    cursor.execute(
        """

        SELECT COUNT(*)

        FROM attendance

        WHERE date = ?

        """,
        (today,)
    )

    today_attendance = cursor.fetchone()[0]

    connection.close()

    return {
        "total_students": total_students,
        "today_attendance": today_attendance
    }


class UpdateStudentRequest(
    BaseModel
):

    name: str


@app.put("/students/{student_id}")
def update_student(
    student_id: int,
    request: UpdateStudentRequest
):

    connection = sqlite3.connect(DB_PATH)

    cursor = connection.cursor()

    cursor.execute(
        """

        UPDATE users

        SET name = ?

        WHERE student_id = ?

        """,
        (
            request.name,
            student_id
        )
    )

    connection.commit()

    connection.close()

    global known_faces

    known_faces = load_known_faces()

    return {
        "status": "UPDATED"
    }
