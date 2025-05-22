#!/usr/bin/env python
# batch_run.py
import asyncio
import argparse
import os
import sys

# Add the project root to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.batch_generate import save_batch_results

def parse_args():
    parser = argparse.ArgumentParser(description="Generate multiple batches of questions for conversation cards")
    
    parser.add_argument("--topic", type=str, default="Relationships & Dating", 
                        help="The conversation topic")
    
    parser.add_argument("--card-type", type=str, default="Deep Conversations",
                        help="Card type (e.g., 'Deep Conversations', 'Fun Challenges', 'Light Conversation')")
    
    parser.add_argument("--tone", type=str, default="Thoughtful",
                        help="Tone of the prompts (e.g., 'Reflective', 'Playful', 'Serious')")
    
    parser.add_argument("--participants", type=str, default="Solo",
                        help="Number of participants")
    
    parser.add_argument("--relationship", type=str, default="",
                        help="Relationship type (e.g., 'Friends', 'Couples', 'Family')")
    
    parser.add_argument("--batch-size", type=int, default=10,
                        help="Number of batches to generate")
    
    parser.add_argument("--output", type=str, default="batch_results.json",
                        help="Output JSON file to save results")
    
    return parser.parse_args()

async def main():
    args = parse_args()
    
    print(f"Generating {args.batch_size} batches of {args.card_type} cards about {args.topic}...")
    print(f"Tone: {args.tone}, Participants: {args.participants}, Relationship: {args.relationship}")
    
    await save_batch_results(
        topic=args.topic,
        card_type=args.card_type,
        tone=args.tone,
        participants=args.participants,
        relationship=args.relationship,
        batch_size=args.batch_size,
        output_file=args.output
    )
    
    print(f"Results saved to {args.output}")

if __name__ == "__main__":
    asyncio.run(main()) 