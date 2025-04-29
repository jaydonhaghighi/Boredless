from pydantic import BaseModel
from typing import Optional, List, Union

class PromptRequest(BaseModel):
    theme: Optional[str] = None
    interaction_type: Optional[str] = None
    mood: Optional[str] = None
    participants: Optional[str] = None  
    relationship: Optional[str] = None

class Card(BaseModel):
    title: Optional[str]
    instructions: Optional[str]
    question: Optional[str]
    options: Optional[List[str]]
    stances: Optional[List[str]]
    followups: Optional[List[str]]

class PromptResponse(BaseModel):
    cards: List[Card]