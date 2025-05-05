# services/generate.py
import openai
import os
import json
from pydantic import BaseModel
from dotenv import load_dotenv
from models.generate import (
    PromptResponse, 
    DeepConversationCard,
    FunChallengeCard,
    CreativePromptCard, 
    LightConversationCard,
    HotTakeCard,
    PersonalityQuizCard,
    CardType
)
from constants import CARD_TYPE_MAPPING, CARD_FIELD_DEFINITIONS, CARD_TYPE_STRUCTURES

# Load environment variables from .env file
load_dotenv(dotenv_path=os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    '.env'
))

# Get the API key
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise ValueError(
        "OPENAI_API_KEY environment variable is not set. Please create a .env file with your API key."
    )

# Set up OpenAI API key
openai.api_key = api_key

async def generate_prompt(topic: str, card_type: str, tone: str, participants: str, relationship: str) -> PromptResponse:
    
    # Fetch the specific structure and instructions
    structure_info = CARD_TYPE_STRUCTURES.get(card_type, {})
    structure = structure_info.get("structure", {})
    specific_instructions = structure_info.get("instructions", "")
    card_type_id = CARD_TYPE_MAPPING.get(card_type, "light_conversation")

    # Get the field definitions for this card type
    field_definitions = CARD_FIELD_DEFINITIONS.get(card_type_id, "")

    # Format the structure for display in the prompt
    structure_text = f"Front: {structure.get('front', '')}\nBack: {structure.get('back', '')}"

    # Build the system prompt with dynamic, card-type-specific guidance
    system_prompt = f"""
    You are an AI designed to generate engaging, fun, and context-aware conversation or interaction cards for a social conversation app.

    Each card must follow this structure:
        - Topic: {topic or "Any topic"}
        - Card Type: {card_type}
        - Tone: {tone or "Any tone"}
        - Participants: {participants or "Any number"}
        - Relationship: {relationship or "Any relationship"}

    For Card Type '{card_type}', use this card structure:
        {structure_text}

    Instructions:
        {specific_instructions}
        - Match tone and complexity with the tone, relationship type, and number of participants.
        - Avoid clichés, repetition, or insensitive content.
        - Output a single valid JSON object with a top-level key 'cards' whose value is a list of 8 card items.
    
    Each card item should be a JSON object containing the following fields:
    {field_definitions}
    
    IMPORTANT: Make sure to include "card_type": "{card_type_id}" in each card.
    """

    # A simple user prompt to trigger generation
    user_prompt = "Generate 8 conversation cards based on the above system instructions. Only respond with valid JSON."

    # Create an OpenAI client
    client = openai.OpenAI(api_key=api_key)
    
    # Make the API request
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        response_format={"type": "json_object"},
        temperature=0.7,
        max_tokens=5000,
        top_p=0.9
    )
    
    # Get the content from the response
    content = response.choices[0].message.content
    
    # Parse the JSON content
    try:
        content_json = json.loads(content)
        
        # Convert the JSON to a PromptResponse
        prompt_response = PromptResponse.model_validate(content_json)
        return prompt_response
    except Exception as e:
        print(f"Error parsing JSON from OpenAI response: {e}")
        print(f"Response content: {content}")
        raise ValueError(f"Failed to parse OpenAI response: {e}")
