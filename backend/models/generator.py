from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

class PromptRequest(BaseModel):
    theme: Optional[str] = None
    interaction_type: Optional[str] = None
    mood: Optional[str] = None
    participants: Optional[str] = None
    relationship: Optional[str] = None

class PromptResponse(BaseModel):
    prompt: str = Field(description="The formatted prompt text")
    interaction_type: Optional[str] = Field(default=None, description="The type of interaction")
    raw_data: Optional[Dict[str, Any]] = Field(default=None, description="The raw structured data (if available)")