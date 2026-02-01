"""
Prompt management API endpoints
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List
from uuid import UUID

from supabase_client import get_supabase
from auth import AuthUser, require_admin
from models.schemas import (
    EventPromptCreate, EventPromptUpdate, EventPromptResponse
)

router = APIRouter(prefix="/prompts", tags=["prompts"])


@router.get("/event/{event_id}", response_model=List[EventPromptResponse])
async def list_event_prompts(event_id: UUID):
    """List all prompts for an event"""
    supabase = get_supabase()
    
    result = supabase.table("event_prompts").select("*").eq("event_id", str(event_id)).order("display_order").execute()
    
    return result.data or []


@router.get("/{prompt_id}", response_model=EventPromptResponse)
async def get_prompt(prompt_id: UUID):
    """Get a single prompt by ID"""
    supabase = get_supabase()
    
    result = supabase.table("event_prompts").select("*").eq("id", str(prompt_id)).single().execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Prompt not found")
    
    return result.data


@router.post("/event/{event_id}", response_model=EventPromptResponse)
async def create_prompt(
    event_id: UUID,
    prompt: EventPromptCreate,
    user: AuthUser = Depends(require_admin)
):
    """Create a new prompt for an event (admin only)"""
    supabase = get_supabase()
    
    # Check if event exists
    event_result = supabase.table("events").select("id").eq("id", str(event_id)).single().execute()
    if not event_result.data:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Check if option_key already exists for this event
    existing = supabase.table("event_prompts").select("id").eq("event_id", str(event_id)).eq("option_key", prompt.option_key).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail=f"Prompt with option_key '{prompt.option_key}' already exists for this event")
    
    prompt_data = prompt.model_dump()
    prompt_data["event_id"] = str(event_id)
    
    result = supabase.table("event_prompts").insert(prompt_data).execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create prompt")
    
    return result.data[0]


@router.put("/{prompt_id}", response_model=EventPromptResponse)
async def update_prompt(
    prompt_id: UUID,
    prompt: EventPromptUpdate,
    user: AuthUser = Depends(require_admin)
):
    """Update a prompt (admin only)"""
    supabase = get_supabase()
    
    # Filter out None values
    update_data = {k: v for k, v in prompt.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    # If updating option_key, check for duplicates
    if "option_key" in update_data:
        # Get the current prompt to find its event_id
        current = supabase.table("event_prompts").select("event_id").eq("id", str(prompt_id)).single().execute()
        if current.data:
            existing = supabase.table("event_prompts").select("id").eq("event_id", current.data["event_id"]).eq("option_key", update_data["option_key"]).neq("id", str(prompt_id)).execute()
            if existing.data:
                raise HTTPException(status_code=400, detail=f"Prompt with option_key '{update_data['option_key']}' already exists for this event")
    
    result = supabase.table("event_prompts").update(update_data).eq("id", str(prompt_id)).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Prompt not found")
    
    return result.data[0]


@router.delete("/{prompt_id}")
async def delete_prompt(
    prompt_id: UUID,
    user: AuthUser = Depends(require_admin)
):
    """Delete a prompt (admin only)"""
    supabase = get_supabase()
    
    result = supabase.table("event_prompts").delete().eq("id", str(prompt_id)).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Prompt not found")
    
    return {"message": "Prompt deleted successfully"}


@router.post("/{prompt_id}/duplicate", response_model=EventPromptResponse)
async def duplicate_prompt(
    prompt_id: UUID,
    user: AuthUser = Depends(require_admin)
):
    """Duplicate a prompt (admin only)"""
    supabase = get_supabase()
    
    # Get original prompt
    original = supabase.table("event_prompts").select("*").eq("id", str(prompt_id)).single().execute()
    
    if not original.data:
        raise HTTPException(status_code=404, detail="Prompt not found")
    
    # Create new prompt with modified option_key
    new_prompt = original.data.copy()
    del new_prompt["id"]
    del new_prompt["created_at"]
    del new_prompt["updated_at"]
    
    # Find a unique option_key
    base_key = new_prompt["option_key"]
    counter = 1
    while True:
        new_key = f"{base_key}_copy{counter}"
        existing = supabase.table("event_prompts").select("id").eq("event_id", new_prompt["event_id"]).eq("option_key", new_key).execute()
        if not existing.data:
            new_prompt["option_key"] = new_key
            new_prompt["title"] = f"{new_prompt['title']} (Copy)"
            break
        counter += 1
    
    result = supabase.table("event_prompts").insert(new_prompt).execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to duplicate prompt")
    
    return result.data[0]
