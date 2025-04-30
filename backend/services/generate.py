# services/generate.py
import openai
import os
import json
from pydantic import BaseModel
from dotenv import load_dotenv
from models.generate import (
    PromptResponse, 
    ConversationStarterCard,
    InteractiveGameCard,
    QuizCard, 
    DebateCard,
    IcebreakerCard,
    ThoughtProvokingCard,
    CardType
)

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

# Interaction-type specific card structures and instructions
INTERACTION_STRUCTURES = {
    "Conversation Starters": {
        "structure": "Title (optional) + Open-ended Question",
        "instructions": (
            "Generate deep or fun questions that spark sharing and discussion. "
            "Each prompt should be no more than 2 sentences."
        ),
        "model_type": ConversationStarterCard
    },
    "Interactive Games": {
        "structure": "Title + Game Instructions + Action Prompt",
        "instructions": (
            "Create short, easy-to-understand activities involving movement, guessing, or creativity. "
            "Specify how participants should play."
        ),
        "model_type": InteractiveGameCard
    },
    "Quizzes": {
        "structure": "Title + Question + 2-4 Multiple-Choice Options",
        "instructions": (
            "Provide a fun or surprising question with 2-4 answer options. "
            "Indicate the correct answer as part of the structure or a separate field."
        ),
        "model_type": QuizCard
    },
    "Friendly Debates": {
        "structure": "Title + Provocative But Friendly Question + 2 Stances",
        "instructions": (
            "Generate a question inviting different opinions with two clear stances. "
            "Ensure the debate remains light-hearted and respectful."
        ),
        "model_type": DebateCard
    },
    "Icebreakers": {
        "structure": "Fun Title + Very Easy/Light Question",
        "instructions": (
            "Make it playful or silly, perfect for strangers or acquaintances. "
            "Keep it low-pressure and welcoming."
        ),
        "model_type": IcebreakerCard
    },
    "Thought-provoking Questions": {
        "structure": "Short Title + Deep Question",
        "instructions": (
            "Ask reflective or philosophical questions matching a thoughtful tone. "
            "Encourage introspection and meaningful discussion."
        ),
        "model_type": ThoughtProvokingCard
    }
}

# Map friendly names to card type identifiers
INTERACTION_TYPE_MAPPING = {
    "Conversation Starters": "conversation_starter",
    "Interactive Games": "interactive_game",
    "Quizzes": "quiz",
    "Friendly Debates": "debate",
    "Icebreakers": "icebreaker",
    "Thought-provoking Questions": "thought_provoking"
}

async def generate_prompt(theme: str, interaction_type: str, mood: str, participants: str, relationship: str) -> PromptResponse:
    
    # Fetch the specific structure and instructions
    structure_info = INTERACTION_STRUCTURES.get(interaction_type, {})
    structure = structure_info.get("structure", "")
    specific_instructions = structure_info.get("instructions", "")
    card_type_id = INTERACTION_TYPE_MAPPING.get(interaction_type, "conversation_starter")

    # Custom field definitions based on card type
    field_definitions = ""
    if card_type_id == "conversation_starter":
        field_definitions = """
        • card_type: "conversation_starter"
        • title (string, optional)
        • question (string, required)
        • followups (array of strings, optional)
        """
    elif card_type_id == "interactive_game":
        field_definitions = """
        • card_type: "interactive_game"
        • title (string, optional)
        • instructions (string, required)
        • action_prompt (string, required)
        """
    elif card_type_id == "quiz":
        field_definitions = """
        • card_type: "quiz"
        • title (string, optional)
        • question (string, required)
        • options (array of strings, required)
        • correct_answer_index (integer, optional)
        """
    elif card_type_id == "debate":
        field_definitions = """
        • card_type: "debate"
        • title (string, optional)
        • question (string, required)
        • stances (array of strings, required)
        """
    elif card_type_id == "icebreaker":
        field_definitions = """
        • card_type: "icebreaker"
        • title (string, optional)
        • question (string, required)
        """
    elif card_type_id == "thought_provoking":
        field_definitions = """
        • card_type: "thought_provoking"
        • title (string, optional)
        • question (string, required)
        • followups (array of strings, optional)
        """

    # Build the system prompt with dynamic, interaction-type-specific guidance
    system_prompt = f"""
    You are an AI designed to generate engaging, fun, and context-aware conversation or interaction cards for a social conversation app.

    Each card must follow this structure:
        - Theme: {theme}
        - Interaction Type: {interaction_type}
        - Mood: {mood}
        - Participants: {participants}
        - Relationship: {relationship}

    For Interaction Type '{interaction_type}', use this card structure:
        - {structure}

    Instructions:
        - {specific_instructions}
        - Match tone and complexity with the mood, relationship type, and number of participants.
        - Avoid clichés, repetition, or insensitive content.
        - Output a single valid JSON object with a top-level key 'cards' whose value is a list of 8 card items.
    
    Each card item should be a JSON object containing the following fields:
    {field_definitions}
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
