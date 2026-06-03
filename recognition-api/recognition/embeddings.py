import os
from threading import Lock

from insightface.app import FaceAnalysis

_app = None
_app_lock = Lock()


def get_face_app():
    global _app

    if _app is not None:
        return _app

    with _app_lock:
        if _app is not None:
            return _app

        det_size = int(os.environ.get("INSIGHTFACE_DET_SIZE", "320"))
        model_name = os.environ.get("INSIGHTFACE_MODEL_NAME", "buffalo_l")

        face_app = FaceAnalysis(
            name=model_name,
            allowed_modules=["detection", "recognition"],
            providers=["CPUExecutionProvider"],
        )
        face_app.prepare(
            ctx_id=-1,
            det_size=(det_size, det_size),
        )
        _app = face_app

    return _app

def get_face_embedding(frame):

    faces = get_face_app().get(frame)

    if len(faces) == 0:
        return None

    embedding = faces[0].embedding

    return embedding
