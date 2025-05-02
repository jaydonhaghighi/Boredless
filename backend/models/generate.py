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
    title: Optional[str] = None

class ConversationStarterCard(BaseCard):
    question: str
    followups: Optional[List[str]] = None

class InteractiveGameCard(BaseCard):
    instructions: str
    action_prompt: str

class QuizCard(BaseCard):
    question: str
    options: List[str]
    correct_answer_index: Optional[int] = None

class DebateCard(BaseCard):
    question: str
    stances: List[str]

class IcebreakerCard(BaseCard):
    question: str

class ThoughtProvokingCard(BaseCard):
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