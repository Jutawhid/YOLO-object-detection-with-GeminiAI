# Placeholder YOLOv5 Dockerfile
FROM python:3.10-slim
WORKDIR /workspace
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*
RUN git clone https://github.com/ultralytics/yolov5.git .
RUN pip install --no-cache-dir -r requirements.txt
CMD ["bash"]
