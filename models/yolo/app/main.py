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

    # Load model
    model = get_model()

    # Run inference
    try:
        # YOLOv8 returns ultralytics.engine.results.Results object
        results = model.predict(
            source=np.array(pil_img),
            conf=CONF_THRES,
            device=DEVICE,
            verbose=False
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"YOLO inference failed: {e}")

    # Parse detections
    detections: List[DetectionOut] = []
    
    if results and len(results) > 0:
        result = results[0]  # first image
        
        if result.boxes is not None:
            boxes = result.boxes.xyxy.cpu().numpy()  # x1, y1, x2, y2
            confidences = result.boxes.conf.cpu().numpy()
            class_ids = result.boxes.cls.cpu().numpy().astype(int)
            names = result.names

            for i in range(len(boxes)):
                x1, y1, x2, y2 = boxes[i]
                confidence = confidences[i]
                class_id = class_ids[i]
                class_name = names[class_id]

                detections.append(DetectionOut(
                    class_name=class_name,
                    confidence=float(confidence),
                    x=int(x1),
                    y=int(y1),
                    w=int(x2 - x1),
                    h=int(y2 - y1)
                ))

    # Draw annotated image if there are detections
    if detections:
        annotated_img = draw_boxes_pil(pil_img.copy(), detections)
        # Convert to base64
        buffered = io.BytesIO()
        annotated_img.save(buffered, format="PNG")
        annotated_base64 = base64.b64encode(buffered.getvalue()).decode("utf-8")
        annotated_image_base64 = f"data:image/png;base64,{annotated_base64}"
    else:
        # Return original image as base64 if no detections
        buffered = io.BytesIO()
        pil_img.save(buffered, format="PNG")
        original_base64 = base64.b64encode(buffered.getvalue()).decode("utf-8")
        annotated_image_base64 = f"data:image/png;base64,{original_base64}"

    return JSONResponse(content={
        "annotated_image_base64": annotated_image_base64,
        "detections": [det.dict() for det in detections],
        "image_id": image_id
    })


@app.get("/model-info")
async def model_info():
    """Get information about the loaded YOLO model"""
    model = get_model()
    return {
        "model_path": MODEL_PATH,
        "device": DEVICE,
        "confidence_threshold": CONF_THRES,
        "classes": model.names if hasattr(model, 'names') else []
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)  # This is correct