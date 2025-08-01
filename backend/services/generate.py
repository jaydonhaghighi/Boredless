# services/generate.py
import openai
import os
import json
from dotenv import load_dotenv
from models.generate import PromptResponse
from constants import CARD_TYPE_MAPPING, CARD_FIELD_DEFINITIONS, CARD_TYPE_STRUCTURES
from services.cache import get_cache_key, get_from_cache, save_to_cache

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

    # Generate cache key from prompt parameters
    cache_key = get_cache_key(topic, card_type, tone, participants, relationship)
    
    # Check cache for previous responses
    previous_cards = get_from_cache(cache_key)

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
    
    CRITICAL JSON REQUIREMENTS:
    - Use exact field names: "card_type", "title", "question", "reflection", "followups", "twist", "bonus", "perspective1", "perspective2", "debate_twist", "group_vote", "reveal"
    - Do NOT use underscores around field names (e.g., use "question" not "_question_")
    - Do NOT use underscores around card_type values (e.g., use "deep_conversations" not "_deep_conversations")
    - Ensure all string values are properly quoted
    - Ensure all arrays are properly formatted with square brackets
    - Do NOT include any trailing commas or invalid JSON syntax
    
    EXAMPLE JSON STRUCTURE:
    {{
      "cards": [
        {{
          "card_type": "deep_conversations",
          "title": "Example Card Title",
          "question": "What is your question here?",
          "followups": ["Follow-up question 1", "Follow-up question 2"],
          "reflection": "Your reflection text here"
        }}
      ]
    }}
    
    IMPORTANT: Make sure to include "card_type": "{card_type_id}" in each card.
    IMPORTANT: Ensure all required fields are included for each card and properly formatted.

    DIVERSITY GUIDELINES:
    - Explore a wide range of perspectives, angles, and subtopics within the main topic.
    - Approach the topic from unconventional or surprising directions.
    - Vary the linguistic structure and length of your questions (use some short direct questions, some longer scenario-based questions, some hypothetical questions, etc).
    - Avoid using the same question stems/starters across multiple questions (e.g., don't start multiple questions with "What would you...").
    - Use different cognitive levels in your questions (knowledge, application, analysis, evaluation, creation).
    - Consider different emotional tones within the overall specified tone (curious, reflective, challenging, playful).
    - Explicitly check each question against the others to ensure sufficient differentiation.
    - Ensure each question explores a unique facet of the topic that hasn't been covered in other questions.
    """

    # A simple user prompt to trigger generation
    user_prompt = "Generate 8 conversation cards based on the above system instructions. Only respond with valid JSON."

    # If there are previous cards, add them to the context
    if previous_cards:
        previous_cards_json = json.dumps(previous_cards, indent=2)
        system_prompt += f"""
        
        IMPORTANT: Below are cards that have been previously generated for these exact parameters.
        DO NOT repeat or generate similar questions to these. Create completely new, original content.
        Analyze these previous questions carefully to understand their patterns, then deliberately create questions that:
        1. Explore completely different aspects of the topic
        2. Use different linguistic structures
        3. Approach the topic from fresh angles not seen below
        4. Vary in complexity, depth, and tone
        
        Previous cards:
        {previous_cards_json}
        """

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
        top_p=0.9,
        frequency_penalty=0.5,
        presence_penalty=0.5
    )
    
    # Get the content from the response
    content = response.choices[0].message.content
    
    # Parse the JSON content
    try:
        content_json = json.loads(content)
        
        # Validate and clean the cards to ensure they have all required fields
        if 'cards' in content_json:
            validated_cards = []
            
            for card in content_json['cards']:
                # Skip malformed cards or cards with invalid structure
                if not isinstance(card, dict) or 'card_type' not in card:
                    print(f"Warning: Skipping card with invalid structure: {card}")
                    continue
                
                # Clean up malformed card_type values (remove leading underscores)
                card_type_name = card.get('card_type', '').lstrip('_')
                card['card_type'] = card_type_name
                
                # Clean up malformed field names (remove leading/trailing underscores)
                cleaned_card = {}
                for key, value in card.items():
                    cleaned_key = key.strip('_')
                    cleaned_card[cleaned_key] = value
                
                # Validate required fields for specific card types
                if card_type_name == 'deep_conversations':
                    if not all(k in cleaned_card for k in ['question', 'title', 'reflection']):
                        print(f"Warning: Skipping deep_conversations card with missing required fields: {cleaned_card}")
                        continue
                    # Ensure followups exists as at least an empty list
                    if 'followups' not in cleaned_card or cleaned_card['followups'] is None:
                        cleaned_card['followups'] = []
                
                elif card_type_name == 'fun_challenges':
                    if not all(k in cleaned_card for k in ['question', 'title', 'twist']):
                        print(f"Warning: Skipping fun_challenges card with missing required fields: {cleaned_card}")
                        continue
                
                elif card_type_name == 'creative_prompts':
                    if not all(k in cleaned_card for k in ['question', 'title', 'bonus']):
                        print(f"Warning: Skipping creative_prompts card with missing required fields: {cleaned_card}")
                        continue
                
                elif card_type_name == 'light_conversation':
                    if not all(k in cleaned_card for k in ['question', 'title']):
                        print(f"Warning: Skipping light_conversation card with missing required fields: {cleaned_card}")
                        continue
                    # Ensure bonus exists
                    if 'bonus' not in cleaned_card or not cleaned_card['bonus']:
                        cleaned_card['bonus'] = "Just enjoy the conversation!"
                
                elif card_type_name == 'hot_takes':
                    if not all(k in cleaned_card for k in ['question', 'title', 'perspective1', 'perspective2']):
                        print(f"Warning: Skipping hot_takes card with missing required fields: {cleaned_card}")
                        continue
                    # Ensure debate_twist exists
                    if 'debate_twist' not in cleaned_card or not cleaned_card['debate_twist']:
                        cleaned_card['debate_twist'] = "Consider both perspectives!"
                
                elif card_type_name == 'personality_quizzes':
                    if not all(k in cleaned_card for k in ['question', 'title', 'group_vote', 'reveal']):
                        print(f"Warning: Skipping personality_quizzes card with missing required fields: {cleaned_card}")
                        continue
                
                # Card passed validation, add to validated list
                validated_cards.append(cleaned_card)
            
            # Only continue if we have at least one valid card
            if not validated_cards:
                raise ValueError("No valid cards were found in the response. All cards failed validation.")
            
            # Replace the cards in the response with validated cards
            content_json['cards'] = validated_cards
            
            # Save the validated cards to cache
            save_to_cache(cache_key, validated_cards)
        
        # Convert the JSON to a PromptResponse
        prompt_response = PromptResponse.model_validate(content_json)
        return prompt_response
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON from OpenAI response: {e}")
        print(f"Response content: {content}")
        raise ValueError(f"Failed to parse OpenAI response JSON: {e}")
    except Exception as e:
        print(f"Error parsing JSON from OpenAI response: {e}")
        print(f"Response content: {content}")
        raise ValueError(f"Failed to parse OpenAI response: {e}")
    



