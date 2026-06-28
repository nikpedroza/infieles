from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from database import engine
from fastapi.middleware.cors import CORSMiddleware
import models

from routers.users import router as router_user

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Iniciando Server")
    yield
    await engine.dispose()
    print("Apagando Server")

app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], #modificar en produccion
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(router_user,prefix="/user",tags=["user"])
app.mount("/img", StaticFiles(directory="img"), name="img")

@app.get("/")
def root():
    return JSONResponse(content={"status": "ok"}, status_code=200) 

@app.api_route("/img", methods=["GET", "POST", "PUT", "DELETE", "PATCH"], include_in_schema=False)
def block_img():
    return JSONResponse(status_code=403, content={"detail": "No autorizado"})