from fastapi import APIRouter, HTTPException, Form, UploadFile, File, HTTPException, Depends, Query
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
from uuid import UUID, uuid4
import os
import aiofiles
import asyncio
from database import get_db
from schema import UserCreate, PaginatedUsers, CheckDuplicado
from repositories import UsuarioRepository, SocialMediaRepository, InfidelityRepository

router = APIRouter()

@router.get("/", response_model=PaginatedUsers)
async def get_all_users(
    db: AsyncSession = Depends(get_db),
    page: int = Query(default=1, ge=1),
    page_size : int = Query(default=10, ge=1, le=40)
):
    users_repo = UsuarioRepository(db)
    offset = (page - 1) * page_size
    usuarios, total = await users_repo.get_all(offset, page_size)
    return PaginatedUsers(
        data=usuarios,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=-(-total // page_size)
    ) 

@router.get("/{id}")
async def get_user(id: UUID, db: AsyncSession = Depends(get_db)):
    users_repo = UsuarioRepository(db)
    usuario = await users_repo.get_by_id(id)
    if not usuario:
        raise HTTPException(status_code=404, detail={"msg":"usuario innexistente"})
    return usuario

@router.post("/new-user")
async def new_user(
    nombre: str = Form(...),
    apellido: str = Form(...),
    fecha_nacimiento: str = Form(...),
    dni: Optional[str] = Form(None),
    historia_del_infiel: str = Form(...),
    foto_perfil: UploadFile = File(...),
    foto_evidencia: Optional[List[UploadFile]] = File(None),
    instagram: Optional[str] = Form(None),
    twitter: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db)
):
    #Vamos a guardar las fotos en paralelo
    async def guardar_foto(foto: UploadFile, ruta: str) -> None:
        if foto.size > 50 * 1024 * 1024:
            raise HTTPException(status_code=413, detail=f"{foto.filename} es muy grande")
        ruta = os.path.join("img", ruta)
        async with aiofiles.open(ruta, "wb") as f:
            while True:
                chunk = await foto.read(1024 * 64)
                if not chunk:
                    break
                await f.write(chunk)

    users_repo = UsuarioRepository(db)
    socialmedia_repo = SocialMediaRepository(db)
    infiel_repo = InfidelityRepository(db)

    ruta_img = f"{uuid4()}_{foto_perfil.filename}".replace(" ","_")

    nuevo_usuario = UserCreate(
        nombre=nombre,
        apellido=apellido,
        fecha_de_nacimiento=fecha_nacimiento,
        dni=dni,
        foto_perfil=ruta_img
    )

    usuario = await users_repo.create_user(usuario=nuevo_usuario)
    if usuario is None:
        raise HTTPException(status_code=409, detail="El usuario ya existe")

    #Primero guardamos fotos antes de los commits
    fotos_evidencia = []
    tareas = []

    if foto_evidencia:
        for foto in foto_evidencia:
            ruta = f"{uuid4()}_ev_{foto.filename}".replace(" ","_")
            fotos_evidencia.append(ruta)
            tareas.append(guardar_foto(foto, ruta))
    
    await asyncio.gather(guardar_foto(foto_perfil, ruta_img), *tareas)

    
    #Creacion de los demas datos en las distintas tablas
    if instagram:
        await socialmedia_repo.create_social(usuario.id, "instagram", instagram)
    if twitter:
        await socialmedia_repo.create_social(usuario.id, "twitter", twitter)

    infiel_data = await infiel_repo.infidelity_create(user_id=usuario.id, historia=historia_del_infiel)

    if fotos_evidencia:
        for ruta in fotos_evidencia:
            await infiel_repo.infidelity_evidence_create(infiel_data.id, path=ruta)

    await db.commit()

    return JSONResponse(status_code=200, content={"msg":"Persona agregada correctamente"})


@router.post("/{id}/comment")
def comentario(id: str):
    pass
    #HACER

@router.post("/check-usuario")
async def check_usuario(
    nombre: str = Form(...),
    apellido: str = Form(...),
    fecha_nacimiento: str = Form(...),
    db: AsyncSession = Depends(get_db)
):
    users_repo = UsuarioRepository(db)
    user_check = CheckDuplicado(
        nombre=nombre,
        apellido=apellido,
        fecha_de_nacimiento=fecha_nacimiento
    )
    existe = await users_repo.check_existente(user_check)
    return {"existe": bool(existe)}