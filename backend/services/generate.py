# services/generate.py
import openai
import os
import json
from dotenv import load_dotenv
from models.generate import PromptResponse
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
    
    # Validate that the structure contains the expected 'front' and 'back' keys
    if not isinstance(structure, dict) or 'front' not in structure or 'back' not in structure:
        raise ValueError(
            f"Invalid structure for card type '{card_type}'. Expected keys 'front' and 'back' are missing."
        )
    
    specific_instructions = structure_info.get("instructions", "")
    card_type_id = CARD_TYPE_MAPPING.get(card_type, "light_conversation")

    # Get the field definitions for this card type
    field_definitions = CARD_FIELD_DEFINITIONS.get(card_type_id, "")

    # Format the structure for display in the prompt
    structure_text = f"Front: {structure.get('front', '')}\nBack: {structure.get('back', '')}"

    # Build the system prompt with dynamic, card-type-specific guidance
    system_prompt = f"""
    You are a creative assistant trained to generate high-quality, engaging, and context-aware card prompts for a social conversation app. 
    Each card belongs to a specific deck and contains a front-facing prompt and a back-facing interaction based on the deck's logic. 
    Cards must feel human, casual, clever, and fun — suitable for real-time conversation in groups, couples, or games.
    Keep tone appropriate to each deck. Do not generate generic or repetitive content. Use creativity, humor, emotion, or surprise depending on context.

    Each card must follow this structure:
        - Topic: {topic}
        - Card Type: {card_type}
        - Tone: {tone}
        - Participants: {participants}
        - Relationship: {relationship}

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
        model="gpt-4.1-nano",
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
