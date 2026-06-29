from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from models import SocialMedia
from schema import SocialMediaCreate

class SocialMediaRepository():
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create_social(self, user_id: UUID, social_media: str, handle: str) -> None:
        social = SocialMediaCreate(
            user_id=user_id,
            social_media=social_media,
            handle=handle
        )
        social_create = SocialMedia(**social.model_dump())
        self.db.add(social_create)
        await self.db.flush()