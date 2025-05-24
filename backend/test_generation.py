import asyncio
import json
from services.generate import generate_prompt
from models.generate import PromptResponse

async def test_generation():
    try:
        # Call service that generates a prompt based on filters
        prompt_data = await generate_prompt(
            topic="Friendship",
            card_type="Deep Conversations",
            tone="Thoughtful",
            participants="2-4",
            relationship="Friends"
        )
        
        # Print the raw response as JSON
        print("=== RESPONSE DATA ===")
        print(json.dumps(prompt_data.model_dump(), indent=2))
        
        # Validate all cards have required fields
        print("\n=== VALIDATION CHECKS ===")
        for i, card in enumerate(prompt_data.cards):
            print(f"Card #{i+1} - Type: {card.card_type}")
            
            # Check card type-specific required fields
            if card.card_type == "deep_conversations":
                if not hasattr(card, "reflection") or not card.reflection:
                    print(f"ERROR: Card #{i+1} is missing required field 'reflection'")
                if not hasattr(card, "followups"):
                    print(f"ERROR: Card #{i+1} is missing required field 'followups'")
            
            # Add checks for other card types as needed
        
        print("\nTest completed successfully!")
        return prompt_data
    except Exception as e:
        print(f"ERROR: {str(e)}")
        raise

if __name__ == "__main__":
    asyncio.run(test_generation()) 