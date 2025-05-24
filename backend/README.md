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

   Alternatively, you can copy the `.env.example` file:
   ```bash
   cp .env.example .env
   ```
   Then edit the `.env` file to add your actual API key.

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

### OpenAI API Key Issues

If you encounter errors related to the OpenAI API key, such as:

```
Error generating structured output: The api_key client option must be set either by passing api_key to the client or by setting the OPENAI_API_KEY environment variable
```

Make sure you have:

1. Created a `.env` file in the backend directory
2. Added your OpenAI API key to the `.env` file:
   ```
   OPENAI_API_KEY=your_actual_api_key_here
   ```
3. Restarted the server after making these changes

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

# Boredless Backend

The backend server for the Boredless application, built with FastAPI and OpenAI.

## Key Components

- FastAPI for API endpoints
- OpenAI integration for prompt generation
- Caching system for context-aware prompt generation

## Caching System

The caching system stores previously generated cards for specific combinations of parameters (topic, card type, tone, participants, relationship). When generating new prompts with the same parameters, the system:

1. Retrieves previously generated cards from the cache
2. Sends these cards to OpenAI as context to avoid repetition
3. Stores the newly generated cards in the cache for future use

This approach ensures:
- No repetition of questions across multiple sessions with the same parameters
- Improved prompt quality through accumulated context
- Better user experience with increasingly diverse content

### Cache Implementation

- Cache files are stored in the `backend/cache/` directory
- Each unique combination of parameters has its own cache file
- Cache keys are generated using MD5 hashing of parameter strings
- Cache entries persist between application restarts

## Testing

Run the test script to verify the caching system:

```bash
cd backend
python test_cache.py
```

## Running the Application

Start the backend server:

```bash
cd backend
python main.py
```

The server will be available at http://localhost:8000.