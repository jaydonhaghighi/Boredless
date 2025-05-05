# Constants shared across the backend

# Maps friendly names to card type identifiers
INTERACTION_TYPE_MAPPING = {
    "Conversation Starters": "conversation_starter",
    "Interactive Games": "interactive_game",
    "Quizzes": "quiz",
    "Friendly Debates": "debate",
    "Icebreakers": "icebreaker",
    "Thought-provoking Questions": "thought_provoking"
}

# Card field definitions based on card type
CARD_FIELD_DEFINITIONS = {
    "conversation_starter": """
    • card_type: "conversation_starter"
    • title (string, optional)
    • question (string, required)
    • followups (array of strings, optional)
    """,
    "interactive_game": """
    • card_type: "interactive_game"
    • title (string, optional)
    • instructions (string, required)
    • action_prompt (string, required)
    """,
    "quiz": """
    • card_type: "quiz"
    • title (string, optional)
    • question (string, required)
    • options (array of strings, required)
    • correct_answer_index (integer, optional)
    """,
    "debate": """
    • card_type: "debate"
    • title (string, optional)
    • question (string, required)
    • stances (array of strings, required)
    """,
    "icebreaker": """
    • card_type: "icebreaker"
    • title (string, optional)
    • question (string, required)
    """,
    "thought_provoking": """
    • card_type: "thought_provoking"
    • title (string, optional)
    • question (string, required)
    • followups (array of strings, optional)
    """
}

# Import these here to avoid circular imports when importing constants
# These imports needed for model types in INTERACTION_STRUCTURES
from models.generate import (
    ConversationStarterCard,
    InteractiveGameCard,
    QuizCard, 
    DebateCard,
    IcebreakerCard,
    ThoughtProvokingCard
)

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