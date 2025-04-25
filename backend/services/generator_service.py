import openai
import os
from typing import List, Optional, Union, Dict, Any
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from models.generator import PromptRequest, PromptResponse

# Load environment variables from .env file
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))

# Get the API key
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise ValueError("OPENAI_API_KEY environment variable is not set. Please create a .env file with your API key.")

# Set up OpenAI API key
openai.api_key = api_key

# Define structured output models for each interaction type

# Conversation Starters
class ConversationStarter(BaseModel):
    question: str = Field(description="The main conversation starter question")
    follow_up_questions: List[str] = Field(description="2-3 follow-up questions to keep the conversation going")
    context: str = Field(description="Brief context or background for why this question is interesting")
    suitable_for: List[str] = Field(description="Types of relationships or settings this starter works best for")

# Interactive Games
class InteractiveGame(BaseModel):
    name: str = Field(description="Name of the game")
    description: str = Field(description="Brief description of what the game is about")
    rules: List[str] = Field(description="Step-by-step rules for playing the game")
    materials_needed: Optional[List[str]] = Field(default=None, description="Any materials needed to play (if applicable)")
    duration: str = Field(description="Estimated time to play (e.g., '10-15 minutes')")
    difficulty: str = Field(description="How complex the game is (e.g., 'Easy', 'Medium', 'Hard')")

# Quizzes
class QuizQuestion(BaseModel):
    question: str = Field(description="The quiz question")
    options: List[str] = Field(description="Multiple choice options (if applicable)")
    answer: str = Field(description="The correct answer")
    explanation: Optional[str] = Field(default=None, description="Explanation of why this is the correct answer")

class Quiz(BaseModel):
    title: str = Field(description="Title of the quiz")
    description: str = Field(description="Brief description of what the quiz is about")
    questions: List[QuizQuestion] = Field(description="List of quiz questions", min_items=3, max_items=5)

# Friendly Debates
class FriendlyDebate(BaseModel):
    topic: str = Field(description="The debate topic or question")
    context: str = Field(description="Background information on the topic")
    perspective_a: str = Field(description="One perspective or position on the topic")
    perspective_b: str = Field(description="An alternative perspective or position")
    discussion_points: List[str] = Field(description="Key points to consider during the debate")
    ground_rules: List[str] = Field(description="Suggested rules to keep the debate friendly and productive")

# Icebreakers
class Icebreaker(BaseModel):
    activity: str = Field(description="Brief description of the icebreaker activity")
    instructions: str = Field(description="How to introduce and run the icebreaker")
    example: str = Field(description="An example of how someone might respond")
    variations: Optional[List[str]] = Field(default=None, description="Possible variations for different groups")
    ideal_group_size: str = Field(description="The ideal group size for this icebreaker")

# Thought-provoking Questions
class ThoughtProvokingQuestion(BaseModel):
    question: str = Field(description="The main thought-provoking question")
    theme: str = Field(description="The philosophical or conceptual theme of the question")
    context: str = Field(description="Background or context that makes this question interesting")
    perspectives: List[str] = Field(description="Different angles or perspectives to consider")
    related_questions: List[str] = Field(description="Related questions that could follow in the conversation")

# Union type for all interaction types
InteractionOutput = Union[
    ConversationStarter,
    InteractiveGame,
    Quiz,
    FriendlyDebate,
    Icebreaker,
    ThoughtProvokingQuestion
]

class GeneratorService:
    @staticmethod
    async def generate_prompt(request: PromptRequest) -> PromptResponse:
        """
        Generate a structured conversation prompt based on the provided parameters
        using OpenAI's API.

        Args:
            request: PromptRequest containing filter parameters

        Returns:
            PromptResponse containing the generated prompt in structured format
        """
        # Determine which output model to use based on interaction type
        output_model = None
        system_prompt = "You are a creative conversation prompt generator."

        if not request.interaction_type:
            # Default to conversation starter if no interaction type specified
            output_model = ConversationStarter
            interaction_type = "Conversation Starters"
        else:
            interaction_type = request.interaction_type
            if interaction_type == "Conversation Starters":
                output_model = ConversationStarter
            elif interaction_type == "Interactive Games":
                output_model = InteractiveGame
            elif interaction_type == "Quizzes":
                output_model = Quiz
            elif interaction_type == "Friendly Debates":
                output_model = FriendlyDebate
            elif interaction_type == "Icebreakers":
                output_model = Icebreaker
            elif interaction_type == "Thought-provoking Questions":
                output_model = ThoughtProvokingQuestion
            else:
                # Fallback to conversation starter for unknown types
                output_model = ConversationStarter
                interaction_type = "Conversation Starters"

        # Format selected parameters for prompt
        parameters = [f"Interaction Type: {interaction_type}"]
        if request.theme:
            parameters.append(f"Theme: {request.theme}")
        if request.mood:
            parameters.append(f"Mood: {request.mood}")
        if request.participants:
            parameters.append(f"Participants: {request.participants}")
        if request.relationship:
            parameters.append(f"Relationship: {request.relationship}")

        # Build the user prompt
        user_prompt = (
            "Create a structured conversation prompt or activity with the following characteristics:\n"
            + "\n".join(parameters)
            + "\n\nThe output should be engaging, creative, and suitable for the specified audience and mood."
            + "\nProvide your response in a structured format following the schema I'll use to parse your response."
        )

        # Create a detailed system prompt that explains the structured output
        system_prompt = (
            "You are a creative conversation prompt generator that produces structured outputs. "
            "Your responses will be parsed according to a specific schema, so ensure your output "
            "matches the expected structure exactly. Focus on creating engaging, creative content "
            "that matches the requested characteristics."
        )

        try:
            # Call OpenAI API with structured output
            client = openai.OpenAI(api_key=api_key)
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.7,
            )

            # Get the response content
            response_content = response.choices[0].message.content

            # Parse the response into the appropriate model
            structured_output = output_model.model_validate_json(response_content)

            # Convert the structured output to a formatted string
            formatted_output = GeneratorService._format_structured_output(structured_output)

            # Return the enhanced response with structured data
            return PromptResponse(
                prompt=formatted_output,
                interaction_type=interaction_type,
                raw_data=structured_output.model_dump()
            )

        except Exception as e:
            # Fallback to unstructured output if there's an error
            print(f"Error generating structured output: {str(e)}")

            # Call OpenAI API without structured output
            client = openai.OpenAI(api_key=api_key)
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are a creative conversation prompt generator."},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7,
            )

            # Extract and return the generated prompt
            generated_prompt = response.choices[0].message.content.strip()
            return PromptResponse(
                prompt=generated_prompt,
                interaction_type=interaction_type
            )

    @staticmethod
    def _format_structured_output(output: Any) -> str:
        """Format the structured output into a readable string."""
        if isinstance(output, ConversationStarter):
            formatted = f"# {output.question}\n\n"
            formatted += f"**Context:** {output.context}\n\n"
            formatted += "**Follow-up Questions:**\n"
            for i, q in enumerate(output.follow_up_questions, 1):
                formatted += f"{i}. {q}\n"
            formatted += "\n**Best For:** " + ", ".join(output.suitable_for)

        elif isinstance(output, InteractiveGame):
            formatted = f"# {output.name}\n\n"
            formatted += f"**Description:** {output.description}\n\n"
            formatted += "**Rules:**\n"
            for i, rule in enumerate(output.rules, 1):
                formatted += f"{i}. {rule}\n"
            if output.materials_needed:
                formatted += "\n**Materials Needed:**\n"
                for material in output.materials_needed:
                    formatted += f"- {material}\n"
            formatted += f"\n**Duration:** {output.duration}\n"
            formatted += f"**Difficulty:** {output.difficulty}"

        elif isinstance(output, Quiz):
            formatted = f"# {output.title}\n\n"
            formatted += f"**Description:** {output.description}\n\n"
            formatted += "**Questions:**\n\n"
            for i, q in enumerate(output.questions, 1):
                formatted += f"### Question {i}: {q.question}\n"
                if q.options:
                    for option in q.options:
                        formatted += f"- {option}\n"
                formatted += f"\n**Answer:** {q.answer}\n"
                if q.explanation:
                    formatted += f"**Explanation:** {q.explanation}\n"
                formatted += "\n"

        elif isinstance(output, FriendlyDebate):
            formatted = f"# Debate Topic: {output.topic}\n\n"
            formatted += f"**Context:** {output.context}\n\n"
            formatted += f"**Perspective A:** {output.perspective_a}\n\n"
            formatted += f"**Perspective B:** {output.perspective_b}\n\n"
            formatted += "**Discussion Points:**\n"
            for i, point in enumerate(output.discussion_points, 1):
                formatted += f"{i}. {point}\n"
            formatted += "\n**Ground Rules:**\n"
            for i, rule in enumerate(output.ground_rules, 1):
                formatted += f"{i}. {rule}\n"

        elif isinstance(output, Icebreaker):
            formatted = f"# Icebreaker: {output.activity}\n\n"
            formatted += f"**Instructions:** {output.instructions}\n\n"
            formatted += f"**Example:** {output.example}\n\n"
            if output.variations:
                formatted += "**Variations:**\n"
                for i, variation in enumerate(output.variations, 1):
                    formatted += f"{i}. {variation}\n"
                formatted += "\n"
            formatted += f"**Ideal Group Size:** {output.ideal_group_size}"

        elif isinstance(output, ThoughtProvokingQuestion):
            formatted = f"# {output.question}\n\n"
            formatted += f"**Theme:** {output.theme}\n\n"
            formatted += f"**Context:** {output.context}\n\n"
            formatted += "**Perspectives to Consider:**\n"
            for i, perspective in enumerate(output.perspectives, 1):
                formatted += f"{i}. {perspective}\n"
            formatted += "\n**Related Questions:**\n"
            for i, question in enumerate(output.related_questions, 1):
                formatted += f"{i}. {question}\n"

        else:
            # Fallback for unknown types
            formatted = str(output)

        return formatted
