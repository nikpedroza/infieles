from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import uuid4

class Comments(BaseModel):
    id_comments: Optional[str] = Field(default_factory=lambda: str(uuid4()))
    parent_id: Optional[str] = None
    comment_datetime: datetime = Field(default_factory=datetime.utcnow)
    message: str
    