from fastapi import APIRouter, HTTPException, Form, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from services.infieles_data import agregar_persona, base_infieles, guardar_data
from typing import Optional, List
from uuid import uuid4
import aiofiles
from datetime import datetime
from schema.comments import Comments

router = APIRouter()

@router.get("/{id}")
def get_user(id: str):
    if id in base_infieles:
        return JSONResponse(status_code=200, content=base_infieles[id])
    raise HTTPException(status_code=404, detail={"msg":"usuario innexistente"})

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
):
    date_new_user_form = datetime.now().date()
    id_new_user = str(uuid4())
    ruta_img = f"img/{id_new_user}_{foto_perfil.filename}".replace(" ","_")

    if foto_perfil.size > 50 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="La foto de perfil es muy grande")

    async with aiofiles.open(ruta_img, "wb") as f:
        while True:
            chunk = await foto_perfil.read(1024 * 64)
            if not chunk:
                break
            await f.write(chunk)
    
    fotos_evidencia = []
    if foto_evidencia:
        for foto in foto_evidencia:
            ruta_evidencia = f"img/{id_new_user}_ev_{foto.filename}".replace(" ","_")
            if foto_perfil.size > 50 * 1024 * 1024:
                raise HTTPException(status_code=413, detail="La foto de evidencia es muy grande")

            async with aiofiles.open(ruta_evidencia, "wb") as f:
                while True:
                    chunk = await foto.read(1024 * 64)
                    if not chunk:
                        break
                    await f.write(chunk)
            
            fotos_evidencia.append(ruta_evidencia)
    
    dato_user = {
        id_new_user: {
            "name": nombre,
            "surname": apellido,
            "birth_day": fecha_nacimiento,
            "DNI": dni,
            "profile_photo": ruta_img,
            "social_media": {
                "instagram": instagram,
                "twitter": twitter
            },
            "infidelities": [
                {
                    "id_infidelities": f"{uuid4()}",
                    "datetime": f"{date_new_user_form}",
                    "story": historia_del_infiel,
                    "evidence": fotos_evidencia
                }
            ],
            "comments": [
            ]
        }
    }

    agregar_persona(dato_user)
    return JSONResponse(status_code=200, content={"msg":"Persona agregada correctamente"})

@router.post("/{id}/comment")
def comentario(id: str, comment: Comments):
    if id not in base_infieles:
        raise HTTPException(status_code=404, detail={"msg":"usuario innexistente"})
    
    if "comments" not in base_infieles[id]:
        base_infieles[id]["comments"] = []
    
    if comment.parent_id is not None:
        comment_list = base_infieles[id]["comments"]
        for co in comment_list:
            if co["id_comments"] == comment.parent_id:
                break
        else:
            raise HTTPException(status_code=404, detail={"msg":"El comentario al que desea reescribir no existe"})

    comment_dict = jsonable_encoder(comment)
    base_infieles[id]["comments"].append(comment_dict)
    
    guardar_data()
    return JSONResponse(status_code=200, content=base_infieles[id])
