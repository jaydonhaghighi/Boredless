from pydantic import BaseModel
from typing import Optional, List, Union

class PromptRequest(BaseModel):
    theme: Optional[str] = None
    interaction_type: Optional[str] = None
    mood: Optional[str] = None
    participants: Optional[str] = None  
    relationship: Optional[str] = None

class PromptResponse(BaseModel):
    title: str
    question: str
    followups: List[str]