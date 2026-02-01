"""
Event management API endpoints
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from uuid import UUID

from supabase_client import get_supabase
from auth import AuthUser, require_auth, require_admin, verify_token
from models.schemas import (
    EventCreate, EventUpdate, EventResponse, EventWithDetails,
    EventThemeCreate, EventThemeResponse,
    EventStats
)

router = APIRouter(prefix="/events", tags=["events"])


@router.get("", response_model=List[EventResponse])
async def list_events(
    active_only: bool = False,
    user: Optional[AuthUser] = Depends(verify_token)
):
    """
    List all events. 
    - Public: only active events
    - Authenticated: all events
    """
    supabase = get_supabase()
    
    query = supabase.table("events").select("*")
    
    if active_only or user is None:
        query = query.eq("is_active", True)
    
    query = query.order("created_at", desc=True)
    
    result = query.execute()
    return result.data


@router.get("/{slug}", response_model=EventWithDetails)
async def get_event(
    slug: str,
    user: Optional[AuthUser] = Depends(verify_token)
):
    """
    Get event by slug with theme and prompts.
    - Public: only if event is active
    - Authenticated: any event
    """
    supabase = get_supabase()
    
    # Get event
    query = supabase.table("events").select("*").eq("slug", slug)
    
    if user is None:
        query = query.eq("is_active", True)
    
    result = query.single().execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Event not found")
    
    event_data = result.data
    event_id = event_data["id"]
    
    # Get theme
    theme_result = supabase.table("event_themes").select("*").eq("event_id", event_id).single().execute()
    
    # Get prompts
    prompts_result = supabase.table("event_prompts").select("*").eq("event_id", event_id).order("display_order").execute()
    
    return {
        **event_data,
        "theme": theme_result.data,
        "prompts": prompts_result.data or []
    }


@router.post("", response_model=EventResponse)
async def create_event(
    event: EventCreate,
    user: AuthUser = Depends(require_admin)
):
    """Create a new event (admin only)"""
    supabase = get_supabase()
    
    # Check if slug already exists
    existing = supabase.table("events").select("id").eq("slug", event.slug).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Event with this slug already exists")
    
    event_data = event.model_dump()
    event_data["created_by"] = user.user_id
    
    result = supabase.table("events").insert(event_data).execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create event")
    
    return result.data[0]


@router.put("/{event_id}", response_model=EventResponse)
async def update_event(
    event_id: UUID,
    event: EventUpdate,
    user: AuthUser = Depends(require_admin)
):
    """Update an event (admin only)"""
    supabase = get_supabase()
    
    # Filter out None values
    update_data = {k: v for k, v in event.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    # Check if slug is being changed and already exists
    if "slug" in update_data:
        existing = supabase.table("events").select("id").eq("slug", update_data["slug"]).neq("id", str(event_id)).execute()
        if existing.data:
            raise HTTPException(status_code=400, detail="Event with this slug already exists")
    
    result = supabase.table("events").update(update_data).eq("id", str(event_id)).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Event not found")
    
    return result.data[0]


@router.delete("/{event_id}")
async def delete_event(
    event_id: UUID,
    user: AuthUser = Depends(require_admin)
):
    """Delete an event (admin only)"""
    supabase = get_supabase()
    
    result = supabase.table("events").delete().eq("id", str(event_id)).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Event not found")
    
    return {"message": "Event deleted successfully"}


# =====================================================
# Theme Endpoints
# =====================================================

@router.get("/{event_id}/theme", response_model=EventThemeResponse)
async def get_event_theme(
    event_id: UUID,
    user: Optional[AuthUser] = Depends(verify_token)
):
    """Get event theme"""
    supabase = get_supabase()
    
    result = supabase.table("event_themes").select("*").eq("event_id", str(event_id)).single().execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Theme not found")
    
    return result.data


@router.put("/{event_id}/theme", response_model=EventThemeResponse)
async def update_event_theme(
    event_id: UUID,
    theme: EventThemeCreate,
    user: AuthUser = Depends(require_admin)
):
    """Update event theme (admin only)"""
    supabase = get_supabase()
    
    theme_data = theme.model_dump()
    
    # Use upsert to create or update
    result = supabase.table("event_themes").upsert({
        "event_id": str(event_id),
        **theme_data
    }, on_conflict="event_id").execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to update theme")
    
    return result.data[0]


# =====================================================
# Stats Endpoints
# =====================================================

@router.get("/{event_id}/stats", response_model=EventStats)
async def get_event_stats(
    event_id: UUID,
    user: AuthUser = Depends(require_auth)
):
    """Get event statistics"""
    supabase = get_supabase()
    
    # Get event
    event_result = supabase.table("events").select("id, name").eq("id", str(event_id)).single().execute()
    
    if not event_result.data:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Get image stats
    images_result = supabase.table("generated_images").select("id, estimated_cost, created_at").eq("event_id", str(event_id)).execute()
    
    images = images_result.data or []
    
    from datetime import datetime, timezone
    today = datetime.now(timezone.utc).date()
    
    total_images = len(images)
    total_cost = sum(img.get("estimated_cost", 0) or 0 for img in images)
    
    today_images = [img for img in images if img.get("created_at", "").startswith(str(today))]
    images_today = len(today_images)
    cost_today = sum(img.get("estimated_cost", 0) or 0 for img in today_images)
    
    return {
        "event_id": event_id,
        "event_name": event_result.data["name"],
        "total_images": total_images,
        "total_cost": total_cost,
        "images_today": images_today,
        "cost_today": cost_today
    }
