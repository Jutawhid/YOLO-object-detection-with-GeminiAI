# Dockerfile for YOLO FastAPI detection service
# Uses Python slim image. Note: ultralytics and torch may be heavy.
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set working dir
WORKDIR /app

# Install system deps for pillow/opencv
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    git \
    ffmpeg \
    libglib2.0-0 \
    libsm6 \
    libxrender1 \
    libxext6 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for caching
COPY requirements.txt .

# Install pip packages
RUN pip install --upgrade pip setuptools wheel
RUN pip install --no-cache-dir -r requirements.txt

# Copy app code
COPY app ./app

# Expose port
EXPOSE 8000

# Create directory for temporary files (optional)
RUN mkdir -p /data/uploads /data/annotated
ENV UPLOAD_DIR=/data/uploads
ENV ANNOTATED_DIR=/data/annotated

# Provide default model path (will allow ultralytics to download if not present)
ENV YOLO_MODEL_PATH=yolov8n.pt
ENV YOLO_DEVICE=cpu
ENV YOLO_CONF_THRESHOLD=0.25

# Entrypoint
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
