from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from services.infieles_data import cargar_data, guardar_data, base_infieles
from fastapi.middleware.cors import CORSMiddleware

#router
from routers.users import router as router_user

app = FastAPI()
app.include_router(router_user,prefix="/user",tags=["user"])
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # En producción deberías poner la URL de tu front
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/img", StaticFiles(directory="img"), name="img")


@app.on_event("startup")
def startup_event():
    print("Starting up")
    cargar_data()
    print("Datos de Infieles cargados correctamente")

@app.on_event("shutdown")
def shutdown_event():
    print("Shutting down")
    guardar_data()
    print("Datos de Infieles guardados correctamente")

@app.get("/")
def read_root():
    people = {}
    for person_id in base_infieles:
        people[person_id] = {
            "name": base_infieles[person_id].get("name", None),
            "surname": base_infieles[person_id].get("surname", None),
            "birth_day": base_infieles[person_id].get("birth_day", None),
            "profile_photo": base_infieles[person_id].get("profile_photo",None)
        }

    return JSONResponse(status_code=200, content=people)

@app.api_route("/img", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
def block_img():
    return JSONResponse(status_code=403, content={"detail": "No autorizado"})



