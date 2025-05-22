# services/cache.py
import os
import json
import hashlib
from typing import List, Dict, Any, Optional

# Constants
CACHE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "cache")

# Ensure cache directory exists
if not os.path.exists(CACHE_DIR):
    os.makedirs(CACHE_DIR)

def get_cache_key(topic: str, card_type: str, tone: str, participants: str, relationship: str) -> str:
    """
    Generate a unique cache key based on the prompt parameters.
    
    Args:
        topic: The topic of the prompt
        card_type: The type of card
        tone: The tone of the prompt
        participants: The number of participants
        relationship: The relationship type
        
    Returns:
        A hash string representing the cache key
    """
    # Combine all parameters into a single string
    combined = f"{topic.lower()}|{card_type.lower()}|{tone.lower()}|{participants.lower()}|{relationship.lower()}"
    
    # Create a hash to use as the key
    return hashlib.md5(combined.encode()).hexdigest()

def get_cache_path(cache_key: str) -> str:
    """Get the full path to a cache file based on the key."""
    return os.path.join(CACHE_DIR, f"{cache_key}.json")

def get_from_cache(cache_key: str) -> Optional[List[Dict[str, Any]]]:
    """
    Retrieve previous cards from the cache.
    
    Args:
        cache_key: The cache key to look up
        
    Returns:
        List of card dictionaries if found, None otherwise
    """
    cache_path = get_cache_path(cache_key)
    
    if not os.path.exists(cache_path):
        return None
    
    try:
        with open(cache_path, 'r') as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        # If there's an error reading the cache, return None
        return None

def save_to_cache(cache_key: str, cards: List[Dict[str, Any]]) -> None:
    """
    Save generated cards to the cache.
    
    Args:
        cache_key: The cache key to use
        cards: The list of card dictionaries to cache
    """
    cache_path = get_cache_path(cache_key)
    
    # Get existing cache data if it exists
    existing_cards = get_from_cache(cache_key) or []
    
    # Add new cards to existing cache
    all_cards = existing_cards + cards
    
    # Write to cache file
    with open(cache_path, 'w') as f:
        json.dump(all_cards, f, indent=2) 