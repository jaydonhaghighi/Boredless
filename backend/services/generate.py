# services/generate.py
import openai
import os
from pydantic import BaseModel
from dotenv import load_dotenv
from models.generate import PromptResponse

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
        )
    },
    "Interactive Games": {
        "structure": "Title + Game Instructions + Action Prompt",
        "instructions": (
            "Create short, easy-to-understand activities involving movement, guessing, or creativity. "
            "Specify how participants should play."
        )
    },
    "Quizzes": {
        "structure": "Title + Question + 2-4 Multiple-Choice Options",
        "instructions": (
            "Provide a fun or surprising question with 2-4 answer options. "
            "Indicate the correct answer as part of the structure or a separate field."
        )
    },
    "Friendly Debates": {
        "structure": "Title + Provocative But Friendly Question + 2 Stances",
        "instructions": (
            "Generate a question inviting different opinions with two clear stances. "
            "Ensure the debate remains light-hearted and respectful."
        )
    },
    "Icebreakers": {
        "structure": "Fun Title + Very Easy/Light Question",
        "instructions": (
            "Make it playful or silly, perfect for strangers or acquaintances. "
            "Keep it low-pressure and welcoming."
        )
    },
    "Thought-provoking Questions": {
        "structure": "Short Title + Deep Question",
        "instructions": (
            "Ask reflective or philosophical questions matching a thoughtful tone. "
            "Encourage introspection and meaningful discussion."
        )
    }
}

async def generate_prompt(theme: str, interaction_type: str, mood: str, participants: str, relationship: str) -> PromptResponse:
    
    # Fetch the specific structure and instructions
    structure_info = INTERACTION_STRUCTURES.get(interaction_type, {})
    structure = structure_info.get("structure", "")
    specific_instructions = structure_info.get("instructions", "")

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
    Each card item should be a JSON object containing the following fields (when applicable):
        • title (string, optional)
        • instructions (string, optional)
        • question (string)
        • options (array of strings, for quizzes)
        • stances (array of strings, for debates)
        • followups (array of strings)
    """

    # A simple user prompt to trigger generation
    user_prompt = "Generate 8 conversation cards based on the above system instructions."

    client = openai.OpenAI(api_key=api_key)
    response = client.responses.parse(
        model="gpt-4.1-mini",
        input=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        text_format=PromptResponse,
        reasoning={},
        tools=[],
        temperature=0.7,
        max_output_tokens=5000,
        top_p=0.9,
        store=True,
    )

    # Return the parsed PromptResponse
    return response.output_parsed
