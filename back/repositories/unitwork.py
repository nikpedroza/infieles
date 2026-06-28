from database import AsyncSessionLocal
from repositories.users import UsuarioRepository

class UnitOfWork:
    def __init__(self):
        self.db = AsyncSessionLocal()
        self.usuarios = UsuarioRepository(self.db)
    
    async def commit(self):
        await self.db.commit()
    
    async def rollback(self):
        await self.db.commit()
    
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, exc_type, exc, tb):
        if exc_type:
            await self.rollback()
        await self.db.close()

async def subida_generalizada(user_id):
    async with UnitOfWork() as uow:
        usuario = await uow.usuarios
        await uow.commit()