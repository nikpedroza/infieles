from pydantic import BaseModel
from uuid import UUID

class SocialMediaCreate(BaseModel):
    user_id: UUID
    social_media: str
    handle: str