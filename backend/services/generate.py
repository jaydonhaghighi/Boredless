import openai
import os
from typing import List, Optional, Union, Dict, Any
from pydantic import BaseModel
from dotenv import load_dotenv
from models.generate import PromptRequest, PromptResponse

# Load environment variables from .env file
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))

# Get the API key
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise ValueError("OPENAI_API_KEY environment variable is not set. Please create a .env file with your API key.")

# Set up OpenAI API key
openai.api_key = api_key


async def generate_prompt(theme, interaction_type, mood, participants, relationship):
   client = openai.OpenAI(api_key=api_key)
   response = client.responses.parse(
        model="gpt-4o",
        input=[
            {"role": "system", "content": 
             
            """
            You are an AI designed to generate engaging, fun, and context-aware conversation or interaction cards for a social conversation app. 

            Each card is influenced by 5 parameters:
            - Theme (e.g., Casual Chat, Fun & Games, Career & Goals, Relationships & Dating, Family & Home, Personality & Self-discovery, Debates & Opinions, Learning & Education, Pop Culture & Entertainment, Philosophy & Big Questions, Creativity & Imagination)
            - Interaction Type (e.g., Conversation Starters, Interactive Games, Quizzes, Friendly Debates, Icebreakers, Thought-provoking Questions)
            - Mood (e.g., Romantic, Playful, Friendly, Thoughtful, Reflective, Energetic, Serious, Calm, Humourous, Adventurous)
            - Participants (Solo, 2, 3–5, 6+)
            - Relationship (e.g., Strangers, Acquaintances, Friends, Close Friends, Family, Romantic Partners, Coworkers, Mixed Group)

            Your goal is to generate a list of 5–10 creative and unique cards tailored to the specific combination of parameters. The content should be engaging, respectful, suitable for the context, and clearly formatted with:
            - Optional Title
            - Clear instructions (if it's a game, quiz, or activity)
            - A well-written prompt or question

            Always match tone and complexity with the mood, relationship type, and number of participants. Avoid clichés, repetition. Each card should feel human, fresh, and appropriate for the interaction setting.
            """},
            {"role": "user", "content": 
            
            f"""
            Generate 8 conversation cards based on the following:
            Theme: {theme}
            Interaction Type: {interaction_type}
            Mood: {mood}
            Participants: {participants}
            Relationship: {relationship}
            """
            },
        ],
        text_format=PromptResponse,
    )
   
   print(response.output_parsed)
   return response.output_parsed