#!/bin/bash

# Change to the script's directory
cd "$(dirname "$0")"

# Check if .env file exists
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo "Creating .env file from .env.example..."
        cp .env.example .env
        echo "Please update the .env file with your actual API keys."
    else
        echo "Error: .env.example file not found. Please create a .env file with your API keys."
        exit 1
    fi
fi

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Install or update dependencies
pip install -r requirements.txt

# Run the FastAPI application using the run_app.py script
python run_app.py
