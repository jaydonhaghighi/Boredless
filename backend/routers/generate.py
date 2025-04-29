from fastapi import APIRouter, HTTPException
from models.generate import PromptRequest, PromptResponse
from services.generate import generate_prompt  # You'll need to implement this

router = APIRouter(prefix="/generator", tags=["generator"])

@router.post("/", response_model=PromptResponse)
async def create_prompt(request: PromptRequest):
    try:
        # Call service that generates a prompt based on filters
        prompt_data = await generate_prompt(
            theme=request.theme,
            interaction_type=request.interaction_type,
            mood=request.mood,
            participants=request.participants,
            relationship=request.relationship
        )
        return prompt_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{prompt_id}", response_model=PromptResponse)
async def get_prompt(prompt_id: str):
    # Retrieve a saved prompt by ID
    # You'll need to implement this if you want to save prompts
    pass