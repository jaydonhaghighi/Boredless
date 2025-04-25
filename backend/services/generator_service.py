import openai
import os
from dotenv import load_dotenv
from models.generator import PromptRequest, PromptResponse

# Load environment variables
load_dotenv()

# Set up OpenAI API key from environment variable
openai.api_key = os.getenv("OPENAI_API_KEY")

class GeneratorService:
    @staticmethod
    async def generate_prompt(request: PromptRequest) -> PromptResponse:
        """
        Generate a conversation prompt based on the provided parameters
        using OpenAI's API.

        Args:
            request: PromptRequest containing filter parameters

        Returns:
            PromptResponse containing the generated prompt
        """
        # Format selected parameters for prompt
        parameters = []
        if request.theme:
            parameters.append(f"Theme: {request.theme}")
        if request.interaction_type:
            parameters.append(f"Interaction Type: {request.interaction_type}")
        if request.mood:
            parameters.append(f"Mood: {request.mood}")
        if request.participants:
            parameters.append(f"Participants: {request.participants}")
        if request.relationship:
            parameters.append(f"Relationship: {request.relationship}")

        # If no parameters are provided, use a generic prompt
        if not parameters:
            parameters.append("Random prompt")

        # Build the full prompt
        prompt = (
            "Create a conversation prompt or activity for a social setting with the following characteristics:\n"
            + "\n".join(parameters)
            + "\nThe prompt should be engaging, creative, and suitable for the specified audience and mood."
        )

        # Call OpenAI API
        response = openai.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a creative conversation prompt generator."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=300,
            temperature=0.7,
        )

        # Extract and return the generated prompt
        generated_prompt = response.choices[0].message.content.strip()
        return PromptResponse(prompt=generated_prompt)
