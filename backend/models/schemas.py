"""
Pydantic models for API request/response schemas
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID


# =====================================================
# Event Schemas
# =====================================================

class EventThemeBase(BaseModel):
    primary_color: str = "#007B3A"
    secondary_color: str = "#004d25"
    accent_color: Optional[str] = "#00a651"
    background_gradient_start: Optional[str] = "#007B3A"
    background_gradient_end: Optional[str] = "#004d25"
    font_family: Optional[str] = "Alexandria"


class EventThemeCreate(EventThemeBase):
    pass


class EventThemeResponse(EventThemeBase):
    id: UUID
    event_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class EventPromptBase(BaseModel):
    option_key: str
    title: str
    prompt_text: str
    reference_image_url: Optional[str] = None
    preview_image_url: Optional[str] = None
    display_order: int = 0
    is_active: bool = True


class EventPromptCreate(EventPromptBase):
    pass


class EventPromptUpdate(BaseModel):
    option_key: Optional[str] = None
    title: Optional[str] = None
    prompt_text: Optional[str] = None
    reference_image_url: Optional[str] = None
    preview_image_url: Optional[str] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None


class EventPromptResponse(EventPromptBase):
    id: UUID
    event_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class EventBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    company_name: str
    logo_url: Optional[str] = None
    is_active: bool = False
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None


class EventCreate(EventBase):
    pass


class EventUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    company_name: Optional[str] = None
    logo_url: Optional[str] = None
    is_active: Optional[bool] = None
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None


class EventResponse(EventBase):
    id: UUID
    created_by: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class EventWithDetails(EventResponse):
    theme: Optional[EventThemeResponse] = None
    prompts: List[EventPromptResponse] = []


# =====================================================
# Generated Image Schemas
# =====================================================

class GeneratedImageCreate(BaseModel):
    event_id: UUID
    prompt_id: Optional[UUID] = None
    original_image_url: Optional[str] = None
    generated_image_url: str
    qr_code_url: Optional[str] = None
    model_used: str
    tokens_used: Optional[int] = None
    estimated_cost: Optional[float] = None
    processing_time_ms: Optional[int] = None


class GeneratedImageResponse(GeneratedImageCreate):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


# =====================================================
# Image Generation Request
# =====================================================

class ImageGenerationRequest(BaseModel):
    image: str  # Base64 encoded image
    option: str  # Option key (e.g., "bluebrains", "mecno2026")
    event_slug: Optional[str] = None  # Optional event slug for multi-tenant


class ImageGenerationResponse(BaseModel):
    imageUrl: str
    qrCode: Optional[str] = None


# =====================================================
# Analytics Schemas
# =====================================================

class EventStats(BaseModel):
    event_id: UUID
    event_name: str
    total_images: int
    total_cost: float
    images_today: int
    cost_today: float


class DashboardStats(BaseModel):
    total_events: int
    active_events: int
    total_images: int
    total_cost: float
    recent_images: List[GeneratedImageResponse] = []
