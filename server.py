from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import time
from functools import lru_cache
import base64
import json

app = FastAPI()

# Add CORS middleware to allow requests from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pre-calculate coordinate arrays for 512x512x44 volume
DEPTH, HEIGHT, WIDTH = 44, 512, 512
z_coords, y_coords, x_coords = np.meshgrid(
    np.arange(DEPTH),
    np.arange(HEIGHT),
    np.arange(WIDTH),
    indexing='ij'
)

@lru_cache(maxsize=32)
def create_sphere_labelmap(
    center_x: int,
    center_y: int,
    center_z: int,
    radius: int = None
) -> np.ndarray:
    """Creates a sphere-shaped labelmap with caching."""
    if radius is None:
        radius = min(WIDTH, HEIGHT, DEPTH) // 4

    # Calculate distances from center using pre-calculated coordinates
    dist_from_center = np.sqrt(
        (x_coords - center_x)**2 +
        (y_coords - center_y)**2 +
        (z_coords - center_z)**2
    )

    # Create sphere mask (using np.where is faster than boolean indexing)
    return np.where(dist_from_center <= radius, 1, 0).astype(np.int32)

def compress_labelmap(labelmap: np.ndarray) -> str:
    """Encode labelmap as base64 for safe transmission."""
    # Convert directly to base64, removing zlib compression
    labelmap_bytes = labelmap.astype(np.uint8).tobytes()
    return base64.b64encode(labelmap_bytes).decode('utf-8')

@app.get("/api/segmentation")
async def get_segmentation():
    """
    Generates and returns segmentation data including two spheres
    """
    request_start_time = time.time()

    # Create both spheres in parallel using pre-defined positions
    # Use uint8 instead of int32 to reduce memory usage
    red_sphere = create_sphere_labelmap(170, 256, 22).astype(np.uint8)
    green_sphere = create_sphere_labelmap(342, 256, 22).astype(np.uint8)

    # Combine spheres efficiently using numpy operations
    combined_labelmap = np.zeros_like(red_sphere, dtype=np.uint8)
    combined_labelmap = np.where(red_sphere == 1, 1, combined_labelmap)
    combined_labelmap = np.where(green_sphere == 1, 5, combined_labelmap)

    # Encode the labelmap
    encoded_data = compress_labelmap(combined_labelmap)

    request_end_time = time.time()
    print(f"Total request processing time: {(request_end_time - request_start_time):.4f} seconds")

    # Return minimal response
    response_data = {
        "segmentation": {
            "labelmap": encoded_data,
            "dimensions": [DEPTH, HEIGHT, WIDTH],
            "label": "Two Spheres",
            "segments": {
                "Red Sphere": 1,
                "Green Sphere": 5
            }
        },
        "measurements": []  # Empty array for measurements
    }

    # Save response to file
    with open('segmentation_response.json', 'w') as f:
        json.dump(response_data, f, indent=2)

    return response_data

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8081, reload=True)
