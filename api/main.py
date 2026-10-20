from fastapi import FastAPI

from .models import SegmentationRequest, SegmentationResponse
from .segmentation import compute_segmentation

app = FastAPI(title="Nova Customer Segmentation API")


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/segmentation/run", response_model=SegmentationResponse)
def run_segmentation(request: SegmentationRequest) -> dict:
    return compute_segmentation(request)