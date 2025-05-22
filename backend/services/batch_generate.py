# services/batch_generate.py
import asyncio
import json
from typing import List, Dict, Any
from services.generate import generate_prompt
from models.generate import PromptResponse

async def batch_generate(
    topic: str, 
    card_type: str, 
    tone: str, 
    participants: str, 
    relationship: str,
    batch_size: int = 3
) -> Dict[str, Any]:
    """
    Generate the same prompt multiple times and collect all questions into a list.
    
    Args:
        topic: The conversation topic
        card_type: The type of card (e.g., "Deep Conversations", "Fun Challenges")
        tone: The tone of the prompts
        participants: The number of participants
        relationship: The relationship type between participants
        batch_size: Number of batches to generate (default: 3)
        
    Returns:
        Dictionary with all questions grouped by card_type
    """
    # Create tasks for generating prompts in parallel
    tasks = []
    for _ in range(batch_size):
        tasks.append(
            generate_prompt(
                topic=topic,
                card_type=card_type,
                tone=tone,
                participants=participants,
                relationship=relationship
            )
        )
    
    # Run all tasks concurrently
    responses = await asyncio.gather(*tasks)
    
    # Initialize result dictionary
    all_questions: Dict[str, List[str]] = {}
    
    # Extract all questions from each batch
    for response in responses:
        for card in response.cards:
            card_type_id = card.card_type
            
            # Initialize list for this card type if not exists
            if card_type_id not in all_questions:
                all_questions[card_type_id] = []
            
            # Add question to the appropriate list
            all_questions[card_type_id].append(card.question)
    
    return {
        "topic": topic,
        "card_type": card_type,
        "tone": tone,
        "participants": participants,
        "relationship": relationship,
        "batch_size": batch_size,
        "questions": all_questions
    }

async def save_batch_results(
    topic: str, 
    card_type: str, 
    tone: str, 
    participants: str, 
    relationship: str,
    batch_size: int = 3,
    output_file: str = "batch_results.json"
) -> None:
    """
    Generate batches and save results to a JSON file.
    """
    results = await batch_generate(
        topic=topic,
        card_type=card_type,
        tone=tone,
        participants=participants,
        relationship=relationship,
        batch_size=batch_size
    )
    
    # Save results to file
    with open(output_file, "w") as f:
        json.dump(results, f, indent=2)
    
    print(f"Saved {sum(len(questions) for questions in results['questions'].values())} questions to {output_file}")

if __name__ == "__main__":
    # Example usage
    asyncio.run(
        save_batch_results(
            topic="Relationships & Dating",
            card_type="Deep Conversations",
            tone="Thoughtful",
            participants="2",
            relationship="Solo",
            batch_size=5,
            output_file="questions.json"
        )
    ) 