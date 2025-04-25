#!/usr/bin/env python3
"""
Run script for the Boredless API.
This script properly sets up the Python path and runs the FastAPI application with Uvicorn.
"""

import os
import sys
import uvicorn

# Add the backend directory to the Python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

if __name__ == "__main__":
    print(f"Starting Boredless API server...")
    print(f"Python path: {sys.path}")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
