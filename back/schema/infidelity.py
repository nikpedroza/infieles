from pydantic import BaseModel
from uuid import UUID

class InfidelityCreate(BaseModel):
    user_id: UUID
    historia: str

class InfidelityEvidenciaCreate(BaseModel):
    infidelity_id: UUID
    path: str