#!/bin/bash

# Change to the script's directory
cd "$(dirname "$0")"

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Install or update dependencies
pip install -r requirements.txt

# Run the FastAPI application using the run_app.py script
python run_app.py
