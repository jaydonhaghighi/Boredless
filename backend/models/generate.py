from pydantic import BaseModel
from typing import Optional, List, Union

class PromptRequest(BaseModel):
    topic: Optional[str] = None
    card_type: Optional[str] = None
    tone: Optional[str] = None
    participants: Optional[str] = None  
    relationship: Optional[str] = None

# Base card class
class BaseCard(BaseModel):
    title: Optional[str] = None
    card_type: Optional[str] = None

class DeepConversationCard(BaseCard):
    question: str
    followups: Optional[List[str]] = None
    reflection: str

class FunChallengeCard(BaseCard):
    question: str
    twist: str

class CreativePromptCard(BaseCard):
    question: str
    bonus: str

class LightConversationCard(BaseCard):
    question: str
    bonus: Optional[str] = None

class HotTakeCard(BaseCard):
    question: str
    perspective1: str
    perspective2: str
    debate_twist: Optional[str] = None

class PersonalityQuizCard(BaseCard):
    question: str
    group_vote: str
    reveal: str

# Union type for all card types
CardType = Union[
    DeepConversationCard,
    FunChallengeCard,
    CreativePromptCard,
    LightConversationCard,
    HotTakeCard,
    PersonalityQuizCard
]

class PromptResponse(BaseModel):
    cards: List[CardType]