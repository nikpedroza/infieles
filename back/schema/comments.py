from pydantic import BaseModel
from uuid import UUID

class CommentCreate(BaseModel):
    parent_id: UUID | None = None
    mensaje: str