import json
import os 

base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

base_infieles: dict = {}

def cargar_data() -> dict:
    global base_infieles
    with open(os.path.join(base_path, "memory/infieles.json"), "r") as f:
        data = json.load(f)
    base_infieles.update(data)
    return base_infieles

def guardar_data():
    global base_infieles
    with open(os.path.join(base_path, "memory/infieles.json"), "w") as f:
        json.dump(base_infieles, f, indent=4)

def agregar_persona(new_user_data: dict):
    global base_infieles
    base_infieles.update(new_user_data)
    guardar_data()
    return base_infieles