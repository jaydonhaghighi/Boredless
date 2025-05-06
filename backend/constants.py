# Models for card types
from models.generate import (
    DeepConversationCard,
    FunChallengeCard,
    CreativePromptCard, 
    LightConversationCard,
    HotTakeCard,
    PersonalityQuizCard
)

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

# Card type-specific structures and instructions
CARD_TYPE_STRUCTURES = {
    "Deep Conversations": {
        "structure": {
            "front": "A sincere, emotionally relevant question that invites reflection",
            "back": "A short prompt encouraging the person to explain more deeply"
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
            "front": "A playful, wild or daring challenge/question",
            "back": "A rule that escalates the prompt (e.g. take a sip, switch, reveal more)"
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
            "front": "A creative scenario or question",
            "back": "An extra twist that continues the scenario or adds a new creative element"
        },
        "instructions": (
            "Craft a light, imaginative prompt designed to spark storytelling, creativity, or surreal thinking. "
            "The card should feel playful, visual, and open-ended, like a creative writing exercise for conversation."
        ),
        "model_type": CreativePromptCard
    },
    "Light Conversation": {
        "structure": {
            "front": "A fun, easygoing, or observational question",
            "back": "A light follow-up or activity to extend the moment"
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
            "front": "A polarizing or opinion-based question",
            "back": """
                    - Perspective 1: One common viewpoint 
                    - Perspective 2: The opposing view 
                    - Debate twist: A rule (e.g. defend the opposite, vote, time limit)
                    """
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
            "front": "A personality-style label or guessing question ",
            "back": """
                    - Group vote: Instruction for the group to decide 
                    - Reveal: Prompt for the person to reveal and react
                    """
        },
        "instructions": (
            "Create a fun, social quiz-style card where players guess traits about each other. "
            "The question should invite light judgment, identity guessing, or playful analysis. "
            "It works best in group settings where people vote or label each other."
        ),
        "model_type": PersonalityQuizCard
    }
}