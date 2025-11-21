# app/main.py
import io
import base64
import os
from typing import List, Dict, Any

from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from PIL import Image, ImageDraw, ImageFont
import numpy as np

# Use ultralytics (yolov8) for detection
from ultralytics import YOLO

app = FastAPI(title="YOLO Detection Service")

# Config via env (defaults)
MODEL_PATH = os.getenv("YOLO_MODEL_PATH", "yolov8n.pt")
CONF_THRES = float(os.getenv("YOLO_CONF_THRESHOLD", "0.25"))
DEVICE = os.getenv("YOLO_DEVICE", "cpu")  # 'cpu' or 'cuda:0'
MAX_IMAGE_PIXELS = None  # allow large images if needed

# instantiate model lazily (first request) to avoid long startup in some setups
_model: YOLO = None


def get_model() -> YOLO:
    global _model
    if _model is None:
        # This will download the model weights if not present (ultralytics handles that)
        _model = YOLO(MODEL_PATH)
    return _model


class DetectionOut(BaseModel):
    class_name: str
    confidence: float
    x: int
    y: int
    w: int
    h: int


def draw_boxes_pil(img: Image.Image, detections: List[DetectionOut]) -> Image.Image:
    """
    Draw bounding boxes on a PIL image and return the annotated image.
    """
    draw = ImageDraw.Draw(img)
    try:
        font = ImageFont.load_default()
    except Exception:
        font = None

    for det in detections:
        x0 = det.x
        y0 = det.y
        x1 = det.x + det.w
        y1 = det.y + det.h
        # box
        draw.rectangle([x0, y0, x1, y1], outline="red", width=2)
        # label
        label = f"{det.class_name} {det.confidence:.2f}"
        text_w, text_h = draw.textsize(label, font=font) if font else (len(label) * 6, 12)
        # background for text
        draw.rectangle([x0, y0 - text_h - 4, x0 + text_w + 4, y0], fill="red")
        draw.text((x0 + 2, y0 - text_h - 2), label, fill="white", font=font)

    return img

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/detect")
async def detect(image: UploadFile = File(...), image_id: str = Form(None)):
    """
    Accepts multipart form with field 'image' and optional 'image_id' metadata.
    Returns JSON:
      {
        "annotated_image_base64": "data:image/png;base64,...",
        "detections": [{ class, confidence, x, y, w, h }, ...]
      }
    """
    # validate file type
    content_type = image.content_type.lower()
    if not content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid file type. Expected image/*")

    # Read the file into memory
    file_bytes = await image.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Empty file")

    # Load into PIL
    try:
        pil_img = Image.open(io.BytesIO(file_bytes)).convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Unable to decode image: {e}")

    # Run YOLO
    try:
        model = get_model()
        # ultralytics model returns a Results object; we use .predict or .model for detection
        # We use model.predict with parameters to control conf threshold and device
        results = model.predict(source=io.BytesIO(file_bytes), device=DEVICE, conf=CONF_THRES, save=False)
        # results is a list-like object (one per input). We process first item.
        if len(results) == 0:
            detections = []
        else:
            r = results[0]
            # r.boxes.xyxy, r.boxes.conf, r.boxes.cls, r.names map
            boxes = getattr(r, "boxes", None)
            detections = []
            if boxes is not None:
                # boxes.xyxyn? We'll compute pixel coords from box.xyxy
                # r.orig_shape contains original image shape (h,w)
                orig_h, orig_w = r.orig_shape if hasattr(r, "orig_shape") else pil_img.height, pil_img.width
                for box in boxes:
                    # box.xyxy is tensor-like; convert to list
                    xyxy = box.xyxy.tolist() if hasattr(box.xyxy, "tolist") else list(box.xyxy)
                    x1, y1, x2, y2 = map(int, xyxy[:4])
                    w = x2 - x1
                    h = y2 - y1
                    cls_conf = float(box.conf[0]) if hasattr(box.conf, "__len__") else float(box.conf)
                    cls_idx = int(box.cls[0]) if hasattr(box.cls, "__len__") else int(box.cls)
                    class_name = r.names[cls_idx] if hasattr(r, "names") and cls_idx in r.names else str(cls_idx)
                    detections.append(DetectionOut(
                        class_name=class_name,
                        confidence=round(cls_conf, 6),
                        x=x1,
                        y=y1,
                        w=w,
                        h=h
                    ))
            else:
                detections = []
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model inference error: {e}")

    # Draw boxes on the PIL image
    try:
        annotated_img = pil_img.copy()
        annotated_img = draw_boxes_pil(annotated_img, detections)
        buffered = io.BytesIO()
        annotated_img.save(buffered, format="PNG")
        annotated_base64 = base64.b64encode(buffered.getvalue()).decode("utf-8")
        annotated_data_url = f"data:image/png;base64,{annotated_base64}"
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to draw annotated image: {e}")

    # Prepare response JSON
    dets_serializable = [
        {"class": d.class_name, "confidence": float(d.confidence), "x": int(d.x), "y": int(d.y), "w": int(d.w), "h": int(d.h)}
        for d in detections
    ]

    return JSONResponse(
        status_code=200,
        content={
            "annotated_image_base64": annotated_data_url,
            "detections": dets_serializable,
            "meta": {
                "image_filename": image.filename,
                "image_id": image_id,
                "model": MODEL_PATH,
                "device": DEVICE,
                "confidence_threshold": CONF_THRES,
            },
        },
    )
