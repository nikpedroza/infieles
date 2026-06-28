from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from uuid import uuid4
from database import Base

class SocialMedia(Base):
    __tablename__ = "social_media"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    social_media = Column(String, nullable=False)
    handle = Column(String, nullable=False)