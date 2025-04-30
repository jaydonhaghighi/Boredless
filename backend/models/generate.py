from pydantic import BaseModel, Field
from typing import Optional, List, Union, Literal

class PromptRequest(BaseModel):
    theme: Optional[str] = None
    interaction_type: Optional[str] = None
    mood: Optional[str] = None
    participants: Optional[str] = None  
    relationship: Optional[str] = None

# Base card class
class BaseCard(BaseModel):
    card_type: str
    title: Optional[str] = None

class ConversationStarterCard(BaseCard):
    card_type: Literal["conversation_starter"]
    question: str
    followups: Optional[List[str]] = None

class InteractiveGameCard(BaseCard):
    card_type: Literal["interactive_game"]
    instructions: str
    action_prompt: str

class QuizCard(BaseCard):
    card_type: Literal["quiz"]
    question: str
    options: List[str]
    correct_answer_index: Optional[int] = None

class DebateCard(BaseCard):
    card_type: Literal["debate"]
    question: str
    stances: List[str]

class IcebreakerCard(BaseCard):
    card_type: Literal["icebreaker"]
    question: str

class ThoughtProvokingCard(BaseCard):
    card_type: Literal["thought_provoking"]
    question: str
    followups: Optional[List[str]] = None

# Union type for all card types
CardType = Union[
    ConversationStarterCard,
    InteractiveGameCard,
    QuizCard,
    DebateCard,
    IcebreakerCard,
    ThoughtProvokingCard
]

class PromptResponse(BaseModel):
    cards: List[CardType]