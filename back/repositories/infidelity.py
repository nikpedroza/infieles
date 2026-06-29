from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from models import Infidelidades, InfidelidadesEvidencia
from schema import InfidelityCreate, InfidelityEvidenciaCreate

class InfidelityRepository:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def infidelity_create(self, user_id: UUID, historia: str) -> Infidelidades:
        infidelidad = InfidelityCreate(
            user_id=user_id,
            historia=historia
        )
        infidelidad_create = Infidelidades(**infidelidad.model_dump())
        self.db.add(infidelidad_create)
        await self.db.flush()
        await self.db.refresh(infidelidad_create)
        return infidelidad_create

    async def infidelity_evidence_create(self, infidelity_id: UUID, path: str) -> None:
        infidelidad_evidencia = InfidelityEvidenciaCreate(
            infidelity_id=infidelity_id,
            path=path
        )
        infidelidad_evidence_create = InfidelidadesEvidencia(**infidelidad_evidencia.model_dump())
        self.db.add(infidelidad_evidence_create)
        await self.db.flush()

    