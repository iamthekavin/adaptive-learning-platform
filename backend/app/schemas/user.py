from __future__ import annotations

from pydantic import BaseModel, ConfigDict, EmailStr
from datetime import datetime
from typing import Optional, List
from app.models.user import UserRole


class UserBase(BaseModel):
    """Base user schema."""
    email: EmailStr
    name: str
    role: UserRole


class UserCreate(UserBase):
    """Schema for creating a user."""
    password: str


class UserResponse(UserBase):
    """Schema for user response."""
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    """Token response schema."""
    access_token: str
    token_type: str


class TokenData(BaseModel):
    """Token data schema."""
    email: Optional[str] = None


class LoginRequest(BaseModel):
    """Login request schema."""
    email: EmailStr
    password: str


class PaginatedUsers(BaseModel):
    """Paginated users response."""
    total: int
    page: int
    page_size: int
    users: List[UserResponse]


# Rebuild model to resolve forward references
PaginatedUsers.model_rebuild()
