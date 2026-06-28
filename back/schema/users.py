from pydantic import BaseModel
from uuid import UUID
from datetime import date

#Create
class UserCreate(BaseModel):
    nombre: str
    apellido: str
    fecha_de_nacimiento: date
    dni: str | None
    foto_perfil: str

class CheckDuplicado(BaseModel):
    nombre: str
    apellido: str
    fecha_de_nacimiento: date

#Response
class AllUsersResponse(BaseModel):
    id: UUID
    nombre: str
    apelido: str
    foto_perfil: str

class PaginatedUsers(BaseModel):
    data: list[AllUsersResponse]
    total: int
    page: int
    page_size: int
    total_pages: int