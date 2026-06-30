from sqlalchemy import Column, Text, TIMESTAMP, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from uuid import uuid4
from database import Base

class Comentarios(Base):
    __tablename__ = "comments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("comments.id"), nullable=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    mensaje = Column(Text, nullable=False)
    comentario_datetime = Column(TIMESTAMP, nullable=False, default=func.now())