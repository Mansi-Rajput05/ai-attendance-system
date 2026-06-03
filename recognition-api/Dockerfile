FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    OMP_NUM_THREADS=1 \
    OPENBLAS_NUM_THREADS=1 \
    MKL_NUM_THREADS=1 \
    NUMEXPR_NUM_THREADS=1 \
    TORCH_NUM_THREADS=1 \
    INSIGHTFACE_DET_SIZE=320

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        libglib2.0-0 \
        libgl1 \
        libgomp1 \
        libsm6 \
        libxext6 \
        libxrender1 \
        libx11-6 \
        libxcb1 \
        libxau6 \
        libxdmcp6 \
        libxcb-shm0 \
        libxcb-xfixes0 \
        libxcb-render0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN python -m pip install --upgrade pip setuptools wheel \
    && pip install -r requirements.txt \
    && (pip uninstall -y opencv-python || true) \
    && pip install --force-reinstall --no-deps opencv-python-headless==4.10.0.84 \
    && python -c "import cv2; print('opencv', cv2.__version__)"

COPY . .

CMD ["sh", "-c", "uvicorn api:app --host 0.0.0.0 --port ${PORT:-8080}"]
