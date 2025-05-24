# Boredless: Spark Engaging Conversations

"Boredless" is a full-stack mobile application designed to spark engaging conversations and social interactions through a variety of dynamically generated prompt cards. The app offers diverse card types, including "deep conversations," "fun challenges," "personality quizzes," and more, tailored to different social contexts. The goal is to help users avoid awkward silences and transform boring conversations into memorable interactions.

## Project Structure

- **`frontend/`**: Contains the React Native (Expo) mobile application, built with TypeScript.
- **`backend/`**: Houses the Python (FastAPI) API server, responsible for content generation and business logic.

## Technology Stack

### Backend
- **Programming Language**: Python
- **Framework**: FastAPI
- **AI/ML**: OpenAI GPT models (e.g., gpt-4.1-nano) for prompt generation
- **Server**: Uvicorn (ASGI)
- **Data Validation**: Pydantic
- **Environment Management**: python-dotenv

### Frontend
- **Framework**: React Native with Expo
- **Programming Language**: TypeScript
- **Navigation**: Expo Router, React Navigation
- **UI Components**: Custom components, React Native Gesture Handler
- **State Management**: React Context
- **Build Tool**: Expo CLI

### Cloud Services
- **Backend Services**: Google Cloud Platform (Firebase)

## Getting Started

### Prerequisites
- Node.js and npm/yarn
- Python 3.8+ and pip
- Expo CLI
- An OpenAI API key (set as `OPENAI_API_KEY` in a `.env` file in the `backend` directory)
- Firebase project setup and configuration (`FirebaseConfig.ts` in the frontend)

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows use `venv\\Scripts\\activate`
pip install -r requirements.txt
# Create a .env file in this directory with your OPENAI_API_KEY
# Example .env:
# OPENAI_API_KEY=your_openai_api_key_here
uvicorn main:app --reload
```

### Frontend Setup
```bash
cd frontend/boredless
npm install
# Ensure FirebaseConfig.ts is configured with your Firebase project details
npx expo start
```

## Features

- **Dynamic Prompt Generation**: Leverages AI to create unique and engaging conversation starters across various categories.
- **Diverse Card Types**: Offers multiple card formats like "Deep Conversations," "Fun Challenges," "Creative Prompts," "Light Conversation," "Hot Takes," and "Personality Quizzes."
- **Interactive UI**: Smooth navigation and user-friendly interface built with React Native.
- **Personalization (Planned/Example)**:
    - Save favorite conversation topics.
    - User profiles and preferences.
- **Cross-Platform**: Runs on iOS, Android, and Web thanks to Expo.

## How It Works

The frontend application sends requests to the backend API based on user selections (e.g., desired topic, card type, tone). The FastAPI backend processes these requests, interacts with the OpenAI API to generate relevant prompts, and utilizes a caching mechanism to optimize response times and avoid redundant API calls. The generated content is then returned to the frontend and displayed to the user. 