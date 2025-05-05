# Constants shared across the backend

# Maps friendly names to card type identifiers
CARD_TYPE_MAPPING = {
    "Deep Conversations": "deep_conversations",
    "Fun Challenges": "fun_challenges",
    "Creative Prompts": "creative_prompts",
    "Light Conversation": "light_conversation",
    "Hot Takes": "hot_takes",
    "Personality Quizzes": "personality_quizzes"
}

# Card field definitions based on card type
CARD_FIELD_DEFINITIONS = {
    "deep_conversations": """
    • card_type: "deep_conversations"
    • title (string, optional)
    • question (string, required)
    • followups (array of strings, optional)
    • reflection (string, required)
    """,
    "fun_challenges": """
    • card_type: "fun_challenges"
    • title (string, optional)
    • question (string, required)
    • twist (string, required)
    """,
    "creative_prompts": """
    • card_type: "creative_prompts"
    • title (string, optional)
    • question (string, required)
    • bonus (string, required)
    """,
    "light_conversation": """
    • card_type: "light_conversation"
    • title (string, optional)
    • question (string, required)
    • bonus (string, optional)
    """,
    "hot_takes": """
    • card_type: "hot_takes"
    • title (string, optional)
    • question (string, required)
    • perspective1 (string, required)
    • perspective2 (string, required)
    • debate_twist (string, optional)
    """,
    "personality_quizzes": """
    • card_type: "personality_quizzes"
    • title (string, optional)
    • question (string, required)
    • group_vote (string, required)
    • reveal (string, required)
    """
}

# Import these here to avoid circular imports when importing constants
# These imports needed for model types in CARD_TYPE_STRUCTURES
from models.generate import (
    DeepConversationCard,
    FunChallengeCard,
    CreativePromptCard, 
    LightConversationCard,
    HotTakeCard,
    PersonalityQuizCard
)

# Card type-specific structures and instructions
CARD_TYPE_STRUCTURES = {
    "Deep Conversations": {
        "structure": {
            "front": "Open-ended personal question",
            "back": "Reflection: [prompt to go deeper]"
        },
        "instructions": (
            "Create a card for a conversation game focused on personal depth, honesty, and emotional curiosity. "
            "The card should feel open-ended, reflective, and meaningful — like a question that sparks a real "
            "conversation late at night between close friends or partners."
        ),
        "model_type": DeepConversationCard
    },
    "Fun Challenges": {
        "structure": {
            "front": "Daring or playful question",
            "back": "Twist: [game mechanic or rule]"
        },
        "instructions": (
            "Generate a party game card designed to spark energy, laughter, or bold decisions. "
            "The card should be funny, daring, or chaotic — meant for groups of friends or "
            "strangers having drinks, playing games, or letting loose."
        ),
        "model_type": FunChallengeCard
    },
    "Creative Prompts": {
        "structure": {
            "front": "Imaginative scenario",
            "back": "Bonus: [creative extension]"
        },
        "instructions": (
            "Craft a light, imaginative prompt designed to spark storytelling, creativity, or surreal thinking. "
            "The card should feel playful, visual, and open-ended, like a creative writing exercise for conversation."
        ),
        "model_type": CreativePromptCard
    },
    "Light Conversation": {
        "structure": {
            "front": "Casual or small-talk prompt",
            "back": "Bonus: [light follow-up]"
        },
        "instructions": (
            "Generate a casual conversation card suitable for any setting. "
            "These are low-pressure, fun, or amusing prompts that help people start talking, "
            "especially in mixed or new groups."
        ),
        "model_type": LightConversationCard
    },
    "Hot Takes": {
        "structure": {
            "front": "Debatable prompt",
            "back": "Perspective 1 / Perspective 2 / Debate twist"
        },
        "instructions": (
            "Create a card designed to spark a friendly debate or provocative opinion. "
            "The goal is to surface contrasting perspectives and stir conversation, "
            "even disagreement, but in a fun way."
        ),
        "model_type": HotTakeCard
    },
    "Personality Quizzes": {
        "structure": {
            "front": "Group guessing prompt",
            "back": "Group vote / Reveal"
        },
        "instructions": (
            "Create a fun, social quiz-style card where players guess traits about each other. "
            "The question should invite light judgment, identity guessing, or playful analysis. "
            "It works best in group settings where people vote or label each other."
        ),
        "model_type": PersonalityQuizCard
    }
}

# Filter mappings per card type
CARD_TYPE_FILTER_MAPPINGS = {
    "Deep Conversations": {
        "topics": ["Relationships & Dating", "Personality & Self-discovery", "Family & Home", "Philosophy & Big Questions"],
        "tones": ["Thoughtful", "Reflective", "Romantic", "Calm", "Serious"],
        "participants": ["2", "3-5", "Solo"],
        "relationships": ["Self", "Close Friends", "Romantic Partners", "Friends", "Family"]
    },
    "Fun Challenges": {
        "topics": ["Pop Culture & Entertainment", "Casual Chat", "Creativity & Imagination"],
        "tones": ["Playful", "Humourous", "Energetic"],
        "participants": ["3-5", "6+"],
        "relationships": ["Friends", "Aquaintances", "Mixed Group"]
    },
    "Creative Prompts": {
        "topics": ["Creativity & Imagination", "Personality & Self-discovery", "Pop Culture & Entertainment", "Casual Chat"],
        "tones": ["Playful", "Friendly"],
        "participants": ["Solo", "2", "3-5"],
        "relationships": ["Self", "Friends", "Aquaintances", "Mixed Group"]
    },
    "Light Conversation": {
        "topics": ["Casual Chat", "Pop Culture & Entertainment", "Career & Goals", "Learning & Education"],
        "tones": ["Friendly", "Calm", "Humourous", "Thoughtful"],
        "participants": ["2", "3-5", "6+"],
        "relationships": ["Strangers", "Aquaintances", "Coworkers", "Friends"]
    },
    "Hot Takes": {
        "topics": ["Pop Culture & Entertainment", "Philosophy & Big Questions", "Debates & Opinions", "Learning & Education"],
        "tones": ["Serious", "Humourous"],
        "participants": ["3-5", "6+"],
        "relationships": ["Friends", "Aquaintances", "Mixed Group"]
    },
    "Personality Quizzes": {
        "topics": ["Personality & Self-discovery", "Pop Culture & Entertainment", "Creativity & Imagination"],
        "tones": ["Playful", "Friendly"],
        "participants": ["3-5", "6+"],
        "relationships": ["Friends", "Aquaintances", "Close Friends"]
    }
} 