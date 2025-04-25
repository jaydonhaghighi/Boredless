# Boredless Backend API

This is the backend API for the Boredless app, which generates conversation prompts using OpenAI's GPT models.

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
3. Create a `.env` file in the backend directory with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

## Running the API

### Option 1: Using the run script (recommended)

```bash
./run.sh
```

### Option 2: Using the run_app.py script

```bash
python run_app.py
```

### Option 3: Running directly with Uvicorn

```bash
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at `http://localhost:8000`.

You can access the API documentation at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Troubleshooting

### Import Errors

If you encounter import errors like `ImportError: attempted relative import with no known parent package`, use the recommended run methods:

```bash
# Navigate to the backend directory first
cd backend

# Use the run script (recommended)
./run.sh

# Or use the run_app.py script
python run_app.py
```

These methods properly set up the Python path to ensure all imports work correctly.

### Package Not Found

If you encounter errors about missing packages, make sure you've installed all dependencies:

```bash
pip install -r requirements.txt
```

## API Endpoints

### Generate Prompt

- **URL**: `/generator/`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "theme": "string (optional)",
    "interaction_type": "string (optional)",
    "mood": "string (optional)",
    "participants": "string (optional)",
    "relationship": "string (optional)"
  }
  ```
- **Response**:
  ```json
  {
    "prompt": "string"
  }
  ```

## Example API Usage

```typescript
// Example API call from frontend
const response = await axios.post('http://localhost:8000/generator/', {
  theme: "Personality & Self-discovery",
  interaction_type: "Conversation Starters",
  mood: "Reflective",
  participants: "3-5",
  relationship: "Friends"
});

const generatedPrompt = response.data.prompt;
```