from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
DATABASE_DIR = BASE_DIR / "database"
DB_PATH = DATABASE_DIR / "attendance.db"
CSV_PATH = DATABASE_DIR / "attendance_report.csv"
ANTI_SPOOF_MODEL_DIR = BASE_DIR / "resources" / "anti_spoof_models"
DETECTION_MODEL_PATH = BASE_DIR / "resources" / "detection_model" / "Widerface-RetinaFace.caffemodel"
DETECTION_DEPLOY_PATH = BASE_DIR / "resources" / "detection_model" / "deploy.prototxt"
