# app/main.py
import io
import base64
import os
import sys
from typing import List, Dict, Any

from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from PIL import Image, ImageDraw, ImageFont
import numpy as np

app = FastAPI(title="YOLO Detection Service")

# Config via env (defaults)
MODEL_PATH = os.getenv("YOLO_MODEL_PATH", "yolov8n.pt")
CONF_THRES = float(os.getenv("YOLO_CONF_THRESHOLD", "0.25"))
DEVICE = os.getenv("YOLO_DEVICE", "cpu")
MAX_IMAGE_PIXELS = None

# Import and model setup
try:
    # Try to handle PyTorch 2.6+ compatibility
    import torch
    from torch.serialization import add_safe_globals
    
    # Add ultralytics classes to safe globals
    try:
        from ultralytics.nn.tasks import DetectionModel
        add_safe_globals([DetectionModel])
        print("✓ Added DetectionModel to safe globals")
    except ImportError as e:
        print(f"⚠ Could not import DetectionModel: {e}")
    
except ImportError as e:
    print(f"⚠ PyTorch import issue: {e}")

# Import ultralytics after torch setup
try:
    from ultralytics import YOLO
    print("✓ Ultralytics imported successfully")
except ImportError as e:
    print(f"❌ Failed to import ultralytics: {e}")
    sys.exit(1)

# Model instance
_model = None

def get_model() -> YOLO:
    global _model
    if _model is None:
        try:
            print(f"Loading YOLO model from: {MODEL_PATH}")
            
            # Method 1: Try with safe globals context
            try:
                from torch.serialization import safe_globals
                from ultralytics.nn.tasks import DetectionModel
                with safe_globals([DetectionModel]):
                    _model = YOLO(MODEL_PATH)
                print("✓ Model loaded with safe_globals context")
            except Exception as e:
                print(f"⚠ safe_globals method failed: {e}")
                
                # Method 2: Try direct loading
                _model = YOLO(MODEL_PATH)
                print("✓ Model loaded with direct method")
                
        except Exception as e:
            print(f"❌ Failed to load model: {e}")
            raise HTTPException(status_code=500, detail=f"Model loading failed: {str(e)}")
    
    return _model

class DetectionOut(BaseModel):
    class_name: str
    confidence: float
    x: int
    y: int
    w: int
    h: int

def draw_boxes_pil(img: Image.Image, detections: List[DetectionOut]) -> Image.Image:
    """Draw bounding boxes on a PIL image."""
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
        
        # Draw bounding box
        draw.rectangle([x0, y0, x1, y1], outline="red", width=2)
        
        # Draw label
        label = f"{det.class_name} {det.confidence:.2f}"
        try:
            # Modern PIL
            bbox = draw.textbbox((0, 0), label, font=font)
            text_w, text_h = bbox[2] - bbox[0], bbox[3] - bbox[1]
        except AttributeError:
            # Legacy PIL
            text_w, text_h = draw.textsize(label, font=font)
        
        # Draw label background
        draw.rectangle([x0, y0 - text_h - 4, x0 + text_w + 4, y0], fill="red")
        draw.text((x0 + 2, y0 - text_h - 2), label, fill="white", font=font)

    return img

@app.on_event("startup")
async def startup_event():
    """Pre-load model on startup."""
    try:
        get_model()
        print("✓ Model pre-loaded successfully")
    except Exception as e:
        print(f"⚠ Model pre-loading failed: {e}")

@app.get("/health")
async def health():
    """Health check endpoint."""
    try:
        model = get_model()
        return {
            "status": "ok", 
            "model_loaded": model is not None,
            "device": DEVICE
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }

@app.post("/detect")
async def detect(image: UploadFile = File(...), image_id: str = Form(None)):
    """Run object detection on uploaded image."""
    # Validate file type
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid file type. Expected image/*")

    # Read file
    try:
        file_bytes = await image.read()
        if not file_bytes:
            raise HTTPException(status_code=400, detail="Empty file")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"File reading failed: {e}")

    # Load image
    try:
        pil_img = Image.open(io.BytesIO(file_bytes)).convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Image decoding failed: {e}")

    # Get model and run inference
    try:
        model = get_model()
        results = model.predict(
            source=np.array(pil_img),
            conf=CONF_THRES,
            device=DEVICE,
            verbose=False
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference failed: {e}")

    # Parse results
    detections: List[DetectionOut] = []
    
    if results and len(results) > 0:
        result = results[0]
        
        if result.boxes is not None:
            boxes = result.boxes.xyxy.cpu().numpy()
            confidences = result.boxes.conf.cpu().numpy()
            class_ids = result.boxes.cls.cpu().numpy().astype(int)
            names = result.names

            for i in range(len(boxes)):
                x1, y1, x2, y2 = boxes[i]
                print(f"❌ Failed to load class_name: {e}" f"Detected: {names[class_ids[i]], confidences[i], int(x1), int(y1), int(x2 - x1), int(y2 - y1)}")
                detections.append(DetectionOut(
                    class_name=names[class_ids[i]],
                    confidence=float(confidences[i]),
                    x=int(x1),
                    y=int(y1),
                    w=int(x2 - x1),
                    h=int(y2 - y1)
                ))

    # Create annotated image
    if detections:
        annotated_img = draw_boxes_pil(pil_img.copy(), detections)
    else:
        annotated_img = pil_img

    # Convert to base64
    buffered = io.BytesIO()
    annotated_img.save(buffered, format="PNG")
    annotated_base64 = base64.b64encode(buffered.getvalue()).decode("utf-8")
    annotated_image_base64 = f"data:image/png;base64,{annotated_base64}"

    return JSONResponse(content={
        "annotated_image_base64": annotated_image_base64,
        "detections": [det.dict() for det in detections],
        "image_id": image_id,
        "detection_count": len(detections)
    })

@app.get("/model-info")
async def model_info():
    """Get model information."""
    model = get_model()
    return {
        "model_path": MODEL_PATH,
        "device": DEVICE,
        "confidence_threshold": CONF_THRES,
        "classes": model.names if hasattr(model, 'names') else [],
        "model_type": type(model).__name__
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)