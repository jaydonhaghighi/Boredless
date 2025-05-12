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
    "Personality Quizzes": "personality_quizzes",
    # Quick Start items now map to standard card types
    "Table for Two": "deep_conversations",
    "Real Talk": "deep_conversations",
    "Last Call": "fun_challenges",  # Changed from last_call
    "Icebreakers": "light_conversation",  # Changed from icebreakers
    "True Self": "personality_quizzes",  # Changed from true_self
    "Hot Seat": "deep_conversations",  # Changed from hot_seat
    "Face-Off": "hot_takes",  # Changed from face_off
    "Deep Cuts": "deep_conversations",  # Changed from deep_cuts
}

# Card field definitions based on card type
CARD_FIELD_DEFINITIONS = {
    "deep_conversations": """
    • card_type: "deep_conversations"
    • title (string)
    • question (string, required)
    • followups (array of strings)
    • reflection (string, required)
    """,
    "fun_challenges": """
    • card_type: "fun_challenges"
    • title (string)
    • question (string, required)
    • twist (string, required)
    """,
    "creative_prompts": """
    • card_type: "creative_prompts"
    • title (string)
    • question (string, required)
    • bonus (string, required)
    """,
    "light_conversation": """
    • card_type: "light_conversation"
    • title (string)
    • question (string, required)
    • bonus (string, required)
    """,
    "hot_takes": """
    • card_type: "hot_takes"
    • title (string)
    • question (string, required)
    • perspective1 (string, required)
    • perspective2 (string, required)
    • debate_twist (string, required)
    """,
    "personality_quizzes": """
    • card_type: "personality_quizzes"
    • title (string)
    • question (string, required)
    • group_vote (string, required)
    • reveal (string, required)
    """,
    # Quick Start items use the standard card types
    "table_for_two": """
    • card_type: "deep_conversations"
    • title (string)
    • question (string, required)
    • followups (array of strings)
    • reflection (string, required)
    """,
    "real_talk": """
    • card_type: "deep_conversations"
    • title (string)
    • question (string, required)
    • followups (array of strings)
    • reflection (string, required)
    """,
    "last_call": """
    • card_type: "fun_challenges"
    • title (string)
    • question (string, required)
    • twist (string, required)
    """,
    "icebreakers": """
    • card_type: "light_conversation"
    • title (string)
    • question (string, required)
    • bonus (string, required)
    """,
    "true_self": """
    • card_type: "personality_quizzes"
    • title (string)
    • question (string, required)
    • group_vote (string, required)
    • reveal (string, required)
    """,
    "hot_seat": """
    • card_type: "deep_conversations"
    • title (string)
    • question (string, required)
    • followups (array of strings)
    • reflection (string, required)
    """,
    "face_off": """
    • card_type: "hot_takes"
    • title (string)
    • question (string, required)
    • perspective1 (string, required)
    • perspective2 (string, required)
    • debate_twist (string, required)
    """,
    "deep_cuts": """
    • card_type: "deep_conversations"
    • title (string)
    • question (string, required)
    • followups (array of strings)
    • reflection (string, required)
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
    },
    # Merged Quick Pick structures
    "Table for Two": {
        "structure": {
            "front": "A meaningful, romantic, or playful question for couples",
            "back": "Follow-up: A deeper or more specific prompt to extend the moment"
        },
        "instructions": (
            "Generate a conversation card meant for romantic partners. These cards are designed for use on a date night or quiet moment together. "
            "The tone should range from tender and sweet to flirty and emotionally rich. "
            "Avoid cliché or overused 'love questions' — aim for originality and honesty."
        ),
        "model_type": DeepConversationCard
    },
    "Real Talk": {
        "structure": {
            "front": "A heartfelt or revealing question between friends",
            "back": "Reflection: A prompt to unpack or explain the response"
        },
        "instructions": (
            """Generate a conversation card meant for close friends who want to have a real, emotionally open conversation.
            These questions should break the surface and get into feelings, regrets, dreams, or things unsaid.
            The tone should be vulnerable yet safe — emotionally intelligent, but not clinical."""
        ),
        "model_type": DeepConversationCard
    },
    "Last Call": {
        "structure": {
            "front": "A bold, revealing, or hilarious challenge",
            "back": "Twist: A rule or action that escalates the tension (e.g., 'Take a sip,' 'Nominate someone,' 'Tell the full story')"
        },
        "instructions": (
            """Generate a party-style card meant for people who are drinking, laughing, and in the mood for something chaotic or bold.
            The card should involve dares, reveals, games, or dramatic turns. It should not be emotionally heavy. 
            Think 'chaotic fun' like the last game of the night."""
        ),
        "model_type": FunChallengeCard
    },
    "Icebreakers": {
        "structure": {
            "front": "A light, fun, or quirky question anyone can answer",
            "back": "Bonus: A second, humorous or surprising follow-up"
        },
        "instructions": (
            """Generate a card meant for people who don't know each other well. 
            The card should help strangers or acquaintances start talking.
            It should be surprising or unusual enough to be memorable, but still safe and easy to answer. 
            Avoid anything too personal or awkward."""
        ),
        "model_type": LightConversationCard
    },
    "True Self": {
        "structure": {
            "front": "A playful personality-style question (e.g., 'What kind of villain are they?')",
            "back": """
                    - Group vote: Ask others to decide
                    - Reveal: The person explains if they agree or not
                    """
        },
        "instructions": (
            """Generate a card that mimics a personality quiz you'd find in a magazine 
            fun, sometimes ridiculous, and perfect for a group to debate about one person. 
            Everyone votes or guesses who matches the label, and then the person reveals their own view."""
        ),
        "model_type": PersonalityQuizCard
    },
    "Hot Seat": {
        "structure": {
            "front": "A revealing question aimed at one person",
            "back": "Push further: A second question that goes even deeper"
        },
        "instructions": (
            """Generate a card that targets one person with a personal, challenging, or revealing question. 
            This card is designed for brave moments among people who know each other well. 
            The tone should be direct but not cruel — think vulnerable, not shocking."""
        ),
        "model_type": DeepConversationCard
    },
    "Face-Off": {
        "structure": {
            "front": "A polarizing question with two clear sides",
            "back": """- Perspective 1: Common stance
                       - Perspective 2: Opposing view
                       - Debate twist: A mechanic like "argue the opposite" or "majority vote"""
        },
        "instructions": (
            """Generate a card that sparks a fun debate. These cards should present a polarizing question and two contrasting perspectives. 
            They're meant to create conversation, disagreements, or team splits — all in good spirit. Avoid dull or obvious binaries."""
        ),
        "model_type": HotTakeCard
    },
    "Deep Cuts": {
        "structure": {
            "front": "A deep or abstract emotional prompt",
            "back": "Follow-up: A related question that cuts even deeper"
        },
        "instructions": (
            """Generate a slow, emotional card that's meant to be answered when the group is quiet and reflective. 
            These are cards for people who trust each other and want to talk about what really matters. 
            The tone should be existential, soulful, and sometimes even sad."""
        ),
        "model_type": DeepConversationCard
    }
}