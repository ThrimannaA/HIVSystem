#!/bin/bash
# Start the API server

# Load environment variables
export PYTHONPATH=$PYTHONPATH:$(pwd)

# Start FastAPI server
uvicorn api.api:app --host 0.0.0.0 --port 8000 --reload