from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from models import Comentarios
from schema import CommentCreate

class CommentsRepository():
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create_comment(self, user_id: UUID, comentario: CommentCreate) -> None:
        comentario_create = Comentarios(
            **comentario.model_dump(),
            user_id=user_id
        )
        self.db.add(comentario_create)
        await self.db.flush()