from fastapi import APIRouter, HTTPException, Depends
from models.generator import PromptRequest, PromptResponse
from services.generator_service import GeneratorService

router = APIRouter(
    prefix="/generator",
    tags=["generator"],
)

@router.post("/", response_model=PromptResponse)
async def generate_prompt(request: PromptRequest):
    try:
        # Use the service to generate the prompt
        response = await GeneratorService.generate_prompt(request)
        return response

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating prompt: {str(e)}")