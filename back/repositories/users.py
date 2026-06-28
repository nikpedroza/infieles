from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import noload
from uuid import UUID
from models.users import Usuario
from schema.users import UserCreate, CheckDuplicado


class UsuarioRepository():
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_all(self, offset: float, limit: int) -> tuple[list[Usuario], int]:
        total_result = await self.db.execute(select(func.count()).select_from(Usuario))
        total = total_result.scalar()

        result = await self.db.execute(
        select(Usuario)
        .options(noload(Usuario.comentarios), noload(Usuario.infidelidades), noload(Usuario.redes_sociales))
        .offset(offset)
        .limit(limit)
        .order_by(Usuario.fecha_creacion)
    )
        usuarios = result.scalars().all()

        return usuarios, total
    
    async def get_by_id(self, id: UUID) -> Usuario | None:
        result = await self.db.execute(
            select(Usuario).where(Usuario.id == id)
        )
        return result.scalar_one_or_none()
    
    async def create_user(self, usuario: UserCreate) -> Usuario | None:
        result = await self.db.execute(
            select(Usuario).where(Usuario.dni == usuario.dni)
        )
        existe = result.scalar_one_or_none()
        if existe:
            return None
        
        usuario_create = Usuario(**usuario.model_dump())
        self.db.add(usuario_create)
        await self.db.flush()
        await self.db.refresh(usuario_create)
        return usuario_create

    async def check_existente(self, user_check: CheckDuplicado) -> Usuario | None:
        resultado = await self.db.execute(
            select(Usuario).where(
                    Usuario.nombre == user_check.nombre,
                    Usuario.apellido == user_check.apellido,
                    Usuario.fecha_de_nacimiento == user_check.fecha_de_nacimiento
                )
            )
        return resultado.scalar_one_or_none()